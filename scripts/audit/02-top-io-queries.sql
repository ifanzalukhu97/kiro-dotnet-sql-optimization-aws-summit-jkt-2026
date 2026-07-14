-- 02-top-io-queries.sql
-- Purpose: Identify top IO-intensive queries for optimization
-- Source: sys.dm_exec_query_stats + sys.dm_exec_sql_text (system DMVs)

USE WideWorldImporters;
GO

SELECT TOP 50
    qs.total_logical_reads                          AS [Total Logical Reads],
    qs.total_logical_writes                         AS [Total Logical Writes],
    qs.execution_count                              AS [Execution Count],
    CAST(qs.total_logical_reads * 1.0 / NULLIF(qs.execution_count, 0) AS DECIMAL(18,2)) AS [Avg Logical Reads],
    CAST(qs.total_worker_time / 1000.0 / NULLIF(qs.execution_count, 0) AS DECIMAL(18,2)) AS [Avg CPU Time (ms)],
    CAST(qs.total_elapsed_time / 1000.0 / NULLIF(qs.execution_count, 0) AS DECIMAL(18,2)) AS [Avg Elapsed Time (ms)],
    qs.creation_time                                AS [Plan Created],
    qs.last_execution_time                          AS [Last Executed],
    SUBSTRING(
        st.text,
        (qs.statement_start_offset / 2) + 1,
        (CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(st.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset) / 2 + 1
    )                                               AS [Query Text]
FROM sys.dm_exec_query_stats AS qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) AS st
WHERE st.dbid = DB_ID('WideWorldImporters')
ORDER BY qs.total_logical_reads DESC;
