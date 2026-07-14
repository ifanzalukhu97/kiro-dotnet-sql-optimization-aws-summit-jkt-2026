-- 05-missing-indexes.sql
-- Purpose: Show SQL Server's missing index recommendations for WideWorldImporters
-- Source: sys.dm_db_missing_index_details + sys.dm_db_missing_index_groups +
--         sys.dm_db_missing_index_group_stats (system DMVs)

USE WideWorldImporters;
GO

SELECT TOP 50
    CAST(gs.avg_total_user_cost * gs.avg_user_impact * (gs.user_seeks + gs.user_scans)
         AS DECIMAL(18,2))                          AS [Improvement Measure],
    gs.user_seeks                                   AS [User Seeks],
    gs.user_scans                                   AS [User Scans],
    CAST(gs.avg_total_user_cost AS DECIMAL(10,2))   AS [Avg Query Cost],
    CAST(gs.avg_user_impact AS DECIMAL(5,2))        AS [Avg Impact (%)],
    d.statement                                     AS [Table],
    d.equality_columns                              AS [Equality Columns],
    d.inequality_columns                            AS [Inequality Columns],
    d.included_columns                              AS [Included Columns],
    'CREATE NONCLUSTERED INDEX [IX_' 
        + REPLACE(REPLACE(REPLACE(d.statement, '[', ''), ']', ''), '.', '_')
        + '_' + CAST(d.index_handle AS VARCHAR(10))
        + '] ON ' + d.statement 
        + ' (' + ISNULL(d.equality_columns, '') 
        + CASE WHEN d.equality_columns IS NOT NULL AND d.inequality_columns IS NOT NULL THEN ', ' ELSE '' END
        + ISNULL(d.inequality_columns, '') + ')'
        + CASE WHEN d.included_columns IS NOT NULL 
               THEN ' INCLUDE (' + d.included_columns + ')'
               ELSE '' END                          AS [Create Index Statement]
FROM sys.dm_db_missing_index_group_stats AS gs
INNER JOIN sys.dm_db_missing_index_groups AS g
    ON gs.group_handle = g.index_group_handle
INNER JOIN sys.dm_db_missing_index_details AS d
    ON g.index_handle = d.index_handle
WHERE d.database_id = DB_ID('WideWorldImporters')
ORDER BY (gs.avg_total_user_cost * gs.avg_user_impact * (gs.user_seeks + gs.user_scans)) DESC;
