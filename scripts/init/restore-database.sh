#!/bin/bash
# restore-database.sh
# Restores WideWorldImporters-Full.bak on first container startup.
# This script starts SQL Server in the background, waits for it to accept
# connections, performs an idempotent restore, then keeps SQL Server running
# in the foreground.

BACKUP_PATH="/docker-entrypoint-initdb.d/WideWorldImporters-Full.bak"
DB_NAME="WideWorldImporters"
SA_PASSWORD="${MSSQL_SA_PASSWORD:-${SA_PASSWORD:-YourStrong!Passw0rd}}"
MAX_WAIT_SECONDS=90

# Detect sqlcmd path (tools18 in newer images, tools in older ones)
if [ -x /opt/mssql-tools18/bin/sqlcmd ]; then
    SQLCMD="/opt/mssql-tools18/bin/sqlcmd -C"
elif [ -x /opt/mssql-tools/bin/sqlcmd ]; then
    SQLCMD="/opt/mssql-tools/bin/sqlcmd"
else
    echo "[restore-database] ERROR: sqlcmd not found."
    exit 1
fi

echo "[restore-database] Starting SQL Server in the background..."
/opt/mssql/bin/sqlservr &
SQL_PID=$!

# Wait for SQL Server to be ready
echo "[restore-database] Waiting for SQL Server to accept connections (timeout: ${MAX_WAIT_SECONDS}s)..."
elapsed=0
while [ $elapsed -lt $MAX_WAIT_SECONDS ]; do
    if $SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -Q "SELECT 1" -b -o /dev/null 2>/dev/null; then
        echo "[restore-database] SQL Server is ready after ${elapsed}s."
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $MAX_WAIT_SECONDS ]; then
    echo "[restore-database] ERROR: SQL Server did not become ready within ${MAX_WAIT_SECONDS} seconds."
    exit 1
fi

# Check if database already exists and is online (idempotent restore)
DB_EXISTS=$($SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = '${DB_NAME}' AND state_desc = 'ONLINE'" 2>/dev/null | tr -d '[:space:]')

if [ "$DB_EXISTS" = "1" ]; then
    echo "[restore-database] Database '${DB_NAME}' already exists and is online. Skipping restore."
else
    # Drop database if it exists in RESTORING state
    DB_RESTORING=$($SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = '${DB_NAME}' AND state_desc = 'RESTORING'" 2>/dev/null | tr -d '[:space:]')
    if [ "$DB_RESTORING" = "1" ]; then
        echo "[restore-database] Database '${DB_NAME}' is in RESTORING state. Dropping it..."
        $SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -Q "DROP DATABASE [${DB_NAME}]" 2>/dev/null
    fi

    # Verify backup file exists
    if [ ! -f "$BACKUP_PATH" ]; then
        echo "[restore-database] ERROR: Backup file not found at ${BACKUP_PATH}."
        echo "[restore-database] Please place WideWorldImporters-Full.bak in the scripts/init/ directory."
        # Don't exit - still keep SQL Server running
        echo "[restore-database] SQL Server is running without WideWorldImporters database."
        wait $SQL_PID
        exit 0
    fi

    echo "[restore-database] Restoring '${DB_NAME}' from ${BACKUP_PATH}..."
    echo "[restore-database] This may take several minutes on Apple Silicon (Rosetta emulation)..."

    # Run restore with extended timeout (no -b flag to avoid TCP timeout errors)
    $SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -t 600 -Q "
        RESTORE DATABASE [${DB_NAME}]
        FROM DISK = '${BACKUP_PATH}'
        WITH
            MOVE 'WWI_Primary' TO '/var/opt/mssql/data/WideWorldImporters.mdf',
            MOVE 'WWI_UserData' TO '/var/opt/mssql/data/WideWorldImporters_UserData.ndf',
            MOVE 'WWI_Log' TO '/var/opt/mssql/data/WideWorldImporters.ldf',
            MOVE 'WWI_InMemory_Data_1' TO '/var/opt/mssql/data/WideWorldImporters_InMemory_Data_1',
            REPLACE,
            STATS = 10;
    "
    RESTORE_EXIT=$?

    # Wait a moment and verify the database came online
    sleep 5
    DB_ONLINE=$($SQLCMD -S localhost -U sa -P "$SA_PASSWORD" -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = '${DB_NAME}' AND state_desc = 'ONLINE'" 2>/dev/null | tr -d '[:space:]')

    if [ "$DB_ONLINE" = "1" ]; then
        echo "[restore-database] Database '${DB_NAME}' restored successfully and is ONLINE."
    elif [ $RESTORE_EXIT -ne 0 ]; then
        echo "[restore-database] WARNING: Restore command exited with code ${RESTORE_EXIT}."
        echo "[restore-database] SQL Server will continue running. Check database state manually."
    fi
fi

# Keep SQL Server running in the foreground
echo "[restore-database] SQL Server is running. Waiting for process..."
wait $SQL_PID
