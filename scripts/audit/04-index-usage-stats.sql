-- 04-index-usage-stats.sql
-- Purpose: Identify underused or unused indexes that may be candidates for removal
-- Source: sys.dm_db_index_usage_stats + sys.indexes + sys.tables + sys.schemas

USE WideWorldImporters;
GO

SELECT TOP 50
    s.name                                          AS [Schema],
    t.name                                          AS [Table],
    i.name                                          AS [Index Name],
    i.type_desc                                     AS [Index Type],
    ius.user_seeks                                  AS [User Seeks],
    ius.user_scans                                  AS [User Scans],
    ius.user_lookups                                AS [User Lookups],
    ius.user_updates                                AS [User Updates],
    (ius.user_seeks + ius.user_scans + ius.user_lookups) AS [Total Reads],
    CAST(
        CASE WHEN ius.user_updates = 0 THEN 0
             ELSE (ius.user_seeks + ius.user_scans + ius.user_lookups) * 1.0 / ius.user_updates
        END AS DECIMAL(10,2)
    )                                               AS [Read-to-Write Ratio],
    ius.last_user_seek                              AS [Last Seek],
    ius.last_user_scan                              AS [Last Scan],
    ius.last_user_update                            AS [Last Update]
FROM sys.dm_db_index_usage_stats AS ius
INNER JOIN sys.indexes AS i
    ON ius.object_id = i.object_id AND ius.index_id = i.index_id
INNER JOIN sys.tables AS t
    ON i.object_id = t.object_id
INNER JOIN sys.schemas AS s
    ON t.schema_id = s.schema_id
WHERE ius.database_id = DB_ID('WideWorldImporters')
  AND i.name IS NOT NULL
  AND s.name IN ('Sales', 'Purchasing', 'Warehouse', 'Application')
ORDER BY (ius.user_seeks + ius.user_scans + ius.user_lookups) ASC;
