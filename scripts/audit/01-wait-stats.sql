-- 01-wait-stats.sql
-- Purpose: Identify top wait types causing performance bottlenecks
-- Source: sys.dm_os_wait_stats (system DMV)

USE WideWorldImporters;
GO

SELECT TOP 50
    ws.wait_type                                    AS [Wait Type],
    ws.waiting_tasks_count                          AS [Wait Count],
    CAST(ws.wait_time_ms / 1000.0 AS DECIMAL(12,2)) AS [Total Wait (sec)],
    CAST(ws.max_wait_time_ms / 1000.0 AS DECIMAL(12,2)) AS [Max Wait (sec)],
    CAST((ws.wait_time_ms - ws.signal_wait_time_ms) / 1000.0 AS DECIMAL(12,2)) AS [Resource Wait (sec)],
    CAST(ws.signal_wait_time_ms / 1000.0 AS DECIMAL(12,2)) AS [Signal Wait (sec)],
    CAST(100.0 * ws.wait_time_ms / NULLIF(SUM(ws.wait_time_ms) OVER (), 0) AS DECIMAL(5,2)) AS [Wait Pct (%)]
FROM sys.dm_os_wait_stats AS ws
WHERE ws.wait_type NOT IN (
    'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE',
    'SLEEP_TASK', 'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH',
    'WAITFOR', 'LOGMGR_QUEUE', 'CHECKPOINT_QUEUE',
    'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT',
    'BROKER_TO_FLUSH', 'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT',
    'CLR_AUTO_EVENT', 'DISPATCHER_QUEUE_SEMAPHORE',
    'FT_IFTS_SCHEDULER_IDLE_WAIT', 'XE_DISPATCHER_WAIT',
    'XE_DISPATCHER_JOIN', 'SQLTRACE_INCREMENTAL_FLUSH_SLEEP',
    'ONDEMAND_TASK_QUEUE', 'BROKER_EVENTHANDLER',
    'SLEEP_BPOOL_FLUSH', 'DIRTY_PAGE_POLL',
    'HADR_FILESTREAM_IOMGR_IOCOMPLETION', 'SP_SERVER_DIAGNOSTICS_SLEEP'
)
AND ws.waiting_tasks_count > 0
ORDER BY ws.wait_time_ms DESC;
