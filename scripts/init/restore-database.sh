#!/bin/bash
# restore-database.sh
# Restores WideWorldImporters-Full.bak on first container startup.
# This script starts SQL Server in the background, waits for it to accept
# connections, performs an idempotent restore, then keeps SQL Server running
# in the foreground.

set -e

BACKUP_PATH="/docker-entrypoint-initdb.d/WideWorldImporters-Full.bak"
DB_NAME="WideWorldImporters"
SA_PASSWORD="${SA_PASSWORD:-YourStrong!Passw0rd}"
MAX_WAIT_SECONDS=60

echo "[restore-database] Starting SQL Server in the background..."
/opt/mssql/bin/sqlservr &
SQL_PID=$!

# Wait for SQL Server to be ready
echo "[restore-database] Waiting for SQL Server to accept connections (timeout: ${MAX_WAIT_SECONDS}s)..."
elapsed=0
while [ $elapsed -lt $MAX_WAIT_SECONDS ]; do
    if /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "SELECT 1" -b -o /dev/null 2>/dev/null; then
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

# Check if database already exists (idempotent restore)
DB_EXISTS=$(/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = '${DB_NAME}'" | tr -d '[:space:]')

if [ "$DB_EXISTS" = "1" ]; then
    echo "[restore-database] Database '${DB_NAME}' already exists. Skipping restore."
else
    # Verify backup file exists
    if [ ! -f "$BACKUP_PATH" ]; then
        echo "[restore-database] ERROR: Backup file not found at ${BACKUP_PATH}."
        echo "[restore-database] Please place WideWorldImporters-Full.bak in the scripts/init/ directory."
        exit 1
    fi

    echo "[restore-database] Restoring '${DB_NAME}' from ${BACKUP_PATH}..."

    # Get logical file names from the backup
    /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "
        RESTORE DATABASE [${DB_NAME}]
        FROM DISK = '${BACKUP_PATH}'
        WITH
            MOVE 'WWI_Primary' TO '/var/opt/mssql/data/WideWorldImporters.mdf',
            MOVE 'WWI_UserData' TO '/var/opt/mssql/data/WideWorldImporters_UserData.ndf',
            MOVE 'WWI_Log' TO '/var/opt/mssql/data/WideWorldImporters.ldf',
            MOVE 'WWI_InMemory_Data_1' TO '/var/opt/mssql/data/WideWorldImporters_InMemory_Data_1',
            REPLACE,
            STATS = 10;
    " -b

    if [ $? -ne 0 ]; then
        echo "[restore-database] ERROR: Database restore failed."
        exit 1
    fi

    echo "[restore-database] Database '${DB_NAME}' restored successfully."
fi

# Keep SQL Server running in the foreground
echo "[restore-database] SQL Server is running. Waiting for process..."
wait $SQL_PID
