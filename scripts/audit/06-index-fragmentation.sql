-- 06-index-fragmentation.sql
-- Purpose: Identify fragmented indexes that may benefit from rebuild or reorganize
-- Source: sys.dm_db_index_physical_stats + sys.indexes + sys.tables + sys.schemas

USE WideWorldImporters;
GO

SELECT TOP 50
    s.name                                          AS [Schema],
    t.name                                          AS [Table],
    i.name                                          AS [Index Name],
    i.type_desc                                     AS [Index Type],
    ps.partition_number                             AS [Partition],
    CAST(ps.avg_fragmentation_in_percent AS DECIMAL(5,2)) AS [Fragmentation (%)],
    ps.page_count                                   AS [Page Count],
    CAST(ps.avg_page_space_used_in_percent AS DECIMAL(5,2)) AS [Avg Page Fullness (%)],
    ps.record_count                                 AS [Record Count],
    ps.fragment_count                               AS [Fragment Count],
    CASE
        WHEN ps.avg_fragmentation_in_percent > 30 THEN 'REBUILD'
        WHEN ps.avg_fragmentation_in_percent > 10 THEN 'REORGANIZE'
        ELSE 'OK'
    END                                             AS [Recommended Action]
FROM sys.dm_db_index_physical_stats(
    DB_ID('WideWorldImporters'), NULL, NULL, NULL, 'LIMITED'
) AS ps
INNER JOIN sys.indexes AS i
    ON ps.object_id = i.object_id AND ps.index_id = i.index_id
INNER JOIN sys.tables AS t
    ON i.object_id = t.object_id
INNER JOIN sys.schemas AS s
    ON t.schema_id = s.schema_id
WHERE i.name IS NOT NULL
  AND ps.page_count > 100
  AND s.name IN ('Sales', 'Purchasing', 'Warehouse', 'Application')
ORDER BY ps.avg_fragmentation_in_percent DESC;
