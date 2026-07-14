-- 03-current-indexes.sql
-- Purpose: List existing indexes on WideWorldImporters tables
-- Source: sys.indexes + sys.index_columns + sys.columns + sys.tables + sys.schemas

USE WideWorldImporters;
GO

SELECT TOP 50
    s.name                                          AS [Schema],
    t.name                                          AS [Table],
    i.name                                          AS [Index Name],
    i.type_desc                                     AS [Index Type],
    i.is_unique                                     AS [Is Unique],
    i.is_primary_key                                AS [Is Primary Key],
    STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
            ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id
          AND ic.index_id = i.index_id
          AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '')                                    AS [Key Columns],
    STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
            ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id
          AND ic.index_id = i.index_id
          AND ic.is_included_column = 1
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '')                                    AS [Included Columns]
FROM sys.indexes AS i
INNER JOIN sys.tables AS t
    ON i.object_id = t.object_id
INNER JOIN sys.schemas AS s
    ON t.schema_id = s.schema_id
WHERE i.name IS NOT NULL
  AND s.name IN ('Sales', 'Purchasing', 'Warehouse', 'Application')
ORDER BY s.name, t.name, i.name;
