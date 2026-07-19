# Product Overview

SQL Server Query Optimization Demo application built for the AWS Summit Jakarta 2026 booth.

## Purpose

Demonstrates SQL Server query performance before and after optimization, assisted by Kiro AI. The app uses intentionally naive query patterns in some controllers to create a visible "before" state, then shows performance improvements via response time badges in the UI.

## Domain

The application wraps the Microsoft WideWorldImporters sample database (a wholesale distribution company) with:
- 12 API endpoints covering Sales, Purchasing, Warehouse, and Application schemas
- A dashboard and 12 page modules for browsing orders, customers, suppliers, invoices, deliveries, inventory, purchase orders, warehouse, payments, product search, and sales reports

## Demo Flow

1. Reset database to slow-query state (`scripts/reset/demo-reset.sql`)
2. Browse the frontend and observe slow response times (shown via green badges)
3. Run DMV audit scripts (`scripts/audit/`) to identify bottlenecks
4. Use Kiro AI to optimize queries and add indexes
5. Refresh to see improved response times

## Key Constraints

- Indexes added during demos must follow the naming convention `IX_Demo_*` or `IX_Optimization_*` so the reset script can drop them
- The demo reset script is idempotent and clears procedure cache and buffer pool
- The app is not production software; it is a conference demonstration tool
