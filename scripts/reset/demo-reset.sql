-- ============================================================================
-- Demo Reset Script
-- Restores WideWorldImporters database to its pre-optimization state.
-- Safe to run multiple times (idempotent).
-- Expected completion: < 30 seconds.
-- ============================================================================

USE [WideWorldImporters];
GO

SET NOCOUNT ON;
GO

PRINT '============================================================';
PRINT 'DEMO RESET — Starting database reset to pre-optimization state';
PRINT '============================================================';
PRINT '';

-- ============================================================================
-- Step 1: Drop all demo/optimization indexes
-- Indexes created during the demo follow the naming convention:
--   IX_Demo_*  or  IX_Optimization_*
-- This step uses a cursor to dynamically find and drop them with IF EXISTS.
-- ============================================================================

PRINT 'Step 1: Dropping demo/optimization indexes...';

BEGIN TRY
    DECLARE @IndexName NVARCHAR(256);
    DECLARE @SchemaName NVARCHAR(128);
    DECLARE @TableName NVARCHAR(256);
    DECLARE @DropSQL NVARCHAR(MAX);
    DECLARE @IndexCount INT = 0;

    DECLARE index_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT
            s.[name] AS SchemaName,
            t.[name] AS TableName,
            i.[name] AS IndexName
        FROM sys.indexes i
        INNER JOIN sys.tables t ON i.[object_id] = t.[object_id]
        INNER JOIN sys.schemas s ON t.[schema_id] = s.[schema_id]
        WHERE i.[name] IS NOT NULL
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0
          AND (
              i.[name] LIKE 'IX_Demo_%'
              OR i.[name] LIKE 'IX_Optimization_%'
          );

    OPEN index_cursor;
    FETCH NEXT FROM index_cursor INTO @SchemaName, @TableName, @IndexName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @DropSQL = N'DROP INDEX IF EXISTS '
            + QUOTENAME(@IndexName)
            + N' ON '
            + QUOTENAME(@SchemaName) + N'.' + QUOTENAME(@TableName);

        EXEC sp_executesql @DropSQL;

        PRINT '  Dropped index: ' + @SchemaName + '.' + @TableName + '.' + @IndexName;
        SET @IndexCount = @IndexCount + 1;

        FETCH NEXT FROM index_cursor INTO @SchemaName, @TableName, @IndexName;
    END

    CLOSE index_cursor;
    DEALLOCATE index_cursor;

    IF @IndexCount = 0
        PRINT '  No demo/optimization indexes found — database already in baseline state.';
    ELSE
        PRINT '  Total indexes dropped: ' + CAST(@IndexCount AS NVARCHAR(10));

    PRINT 'Step 1: COMPLETED successfully.';
    PRINT '';
END TRY
BEGIN CATCH
    IF CURSOR_STATUS('local', 'index_cursor') >= 0
    BEGIN
        CLOSE index_cursor;
        DEALLOCATE index_cursor;
    END

    PRINT 'Step 1: FAILED — ' + ERROR_MESSAGE();
    PRINT '  Error Number: ' + CAST(ERROR_NUMBER() AS NVARCHAR(10));
    PRINT '  Database state: PARTIALLY RESET (indexes may remain).';
    PRINT '';
END CATCH
GO

-- ============================================================================
-- Step 2: Clear procedure cache
-- Forces SQL Server to recompile all query plans on next execution.
-- ============================================================================

PRINT 'Step 2: Clearing procedure cache (DBCC FREEPROCCACHE)...';

BEGIN TRY
    DBCC FREEPROCCACHE;
    PRINT 'Step 2: COMPLETED successfully.';
    PRINT '';
END TRY
BEGIN CATCH
    PRINT 'Step 2: FAILED — ' + ERROR_MESSAGE();
    PRINT '  Error Number: ' + CAST(ERROR_NUMBER() AS NVARCHAR(10));
    PRINT '  Database state: PARTIALLY RESET (procedure cache not cleared).';
    PRINT '';
END CATCH
GO

-- ============================================================================
-- Step 3: Clear buffer pool
-- Forces SQL Server to read data from disk on next query (cold cache).
-- ============================================================================

PRINT 'Step 3: Clearing buffer pool (DBCC DROPCLEANBUFFERS)...';

BEGIN TRY
    DBCC DROPCLEANBUFFERS;
    PRINT 'Step 3: COMPLETED successfully.';
    PRINT '';
END TRY
BEGIN CATCH
    PRINT 'Step 3: FAILED — ' + ERROR_MESSAGE();
    PRINT '  Error Number: ' + CAST(ERROR_NUMBER() AS NVARCHAR(10));
    PRINT '  Database state: PARTIALLY RESET (buffer pool not cleared).';
    PRINT '';
END CATCH
GO

-- ============================================================================
-- Summary
-- ============================================================================

PRINT '============================================================';
PRINT 'DEMO RESET — Complete';
PRINT 'Database is ready for the next demo session.';
PRINT '============================================================';
GO
