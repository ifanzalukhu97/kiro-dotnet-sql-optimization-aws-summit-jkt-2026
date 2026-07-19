# Implementation Plan: Demo Booth AWS Summit Jakarta 2026

## Overview

This plan implements a monorepo application demonstrating SQL Server query optimization on .NET Core assisted by Kiro AI. The implementation covers: repository scaffolding, Docker-based SQL Server setup, ASP.NET Core 5 backend with 12 controllers (some with intentionally naive patterns), Angular 18 dark-mode frontend with 12 pages, SQL audit/reset scripts, and a comprehensive testing suite including property-based tests (FsCheck), integration tests, and Playwright E2E tests.

## Tasks

- [x] 1. Repository setup and infrastructure
  - [x] 1.1 Create monorepo folder structure and root configuration files
    - Create `backend/`, `frontend/`, `scripts/audit/`, `scripts/reset/` directories
    - Create root `.gitignore` with entries for `appsettings.Development.json`, `appsettings.Production.json`, Angular real environment files, `node_modules/`, `bin/`, `obj/`, `.vs/`, `dist/`
    - Create root `docker-compose.yml` with SQL Server 2022 service (port 1433, volume persistence, healthcheck)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 9.5_

  - [x] 1.2 Create Docker initialization script for WideWorldImporters restore
    - Create `scripts/init/` folder with a shell script that restores WideWorldImporters-Full.bak on first container startup
    - Configure volume mount in docker-compose for backup file and init script
    - Ensure idempotent restore (skip if DB already exists)
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Backend project scaffolding
  - [x] 2.1 Create ASP.NET Core 5 Web API solution and project structure
    - Create `backend/WideWorldImporters.sln`
    - Create `backend/WideWorldImporters.Api/WideWorldImporters.Api.csproj` targeting .NET 5
    - Create `Program.cs` and `Startup.cs` with EF Core, CORS, and Swagger configuration
    - Add NuGet packages: `Microsoft.EntityFrameworkCore.SqlServer`, `Swashbuckle.AspNetCore`
    - _Requirements: 10.1_

  - [x] 2.2 Create appsettings configuration files
    - Create `appsettings.json` with default structure (no real credentials)
    - Create `appsettings.Development.json.example` with Docker SQL Server template connection string
    - Create `appsettings.Production.json.example` with AWS RDS template connection string
    - Implement connection string resolution: environment variables first, then appsettings fallback
    - _Requirements: 1.4, 1.5, 2.1, 2.2, 9.1, 9.2, 9.5_

- [x] 3. Database layer — EF Core entities and DbContext
  - [x] 3.1 Create EF Core entity models for Sales schema
    - Create `Models/Entities/Order.cs`, `OrderLine.cs`, `Invoice.cs`, `InvoiceLine.cs`, `Customer.cs`, `CustomerTransaction.cs`
    - Define navigation properties and relationships as specified in design
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Create EF Core entity models for Purchasing and Warehouse schemas
    - Create `Models/Entities/Supplier.cs`, `SupplierCategory.cs`, `PurchaseOrder.cs`, `PurchaseOrderLine.cs`
    - Create `Models/Entities/StockItem.cs`, `StockItemHolding.cs`, `StockItemStockGroup.cs`, `StockGroup.cs`, `StockItemTransaction.cs`
    - Create `Models/Entities/Person.cs` (Application schema)
    - _Requirements: 3.1_

  - [x] 3.3 Create WideWorldImportersContext DbContext
    - Create `Data/WideWorldImportersContext.cs` with DbSets for all entities
    - Configure schema mappings (Sales, Purchasing, Warehouse, Application)
    - Configure relationships and composite keys in `OnModelCreating`
    - Register context in `Startup.cs` with connection string from configuration
    - _Requirements: 3.1, 3.2_

  - [x] 3.4 Create DTO models and paginated response wrapper
    - Create `Models/Dtos/` folder with list DTOs, detail DTOs, and `LookupDto`
    - Create `PaginatedResponse<T>` generic wrapper class
    - _Requirements: 3.2, 3.3, 3.6_

- [x] 4. Backend controllers — Naive pattern controllers
  - [x] 4.1 Implement OrdersController with N+1 pattern
    - Create `Controllers/OrdersController.cs`
    - List endpoint: paginated orders with N+1 loading of order lines (loop per order)
    - Detail endpoint: order with lines and stock items
    - Lookup endpoint: customers dropdown (unpaginated)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.3_

  - [x] 4.2 Implement CustomersController with N+1 pattern
    - Create `Controllers/CustomersController.cs`
    - List endpoint: customers with N+1 loading of summary fields (last transaction, pending payment, invoice count)
    - Detail endpoint: customer with orders, invoices, transactions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

  - [x] 4.3 Implement StockItemsController with SELECT * pattern
    - Create `Controllers/StockItemsController.cs`
    - List endpoint: retrieves all columns but DTO uses < 50% of them
    - Detail endpoint: stock item with holdings and supplier
    - Lookup endpoint: stock items dropdown (unpaginated, full table)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3_

  - [x] 4.4 Implement InvoicesController with SELECT * and missing index pattern
    - Create `Controllers/InvoicesController.cs`
    - List endpoint: SELECT * with date range filter on unindexed column
    - Detail endpoint: invoice with lines and customer
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.4_

  - [x] 4.5 Implement SalesReportController with missing composite index pattern
    - Create `Controllers/SalesReportController.cs`
    - List endpoint: joins InvoiceLines + Invoices + Customers + StockItems, filters on date + customer without composite index
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.4_

  - [x] 4.6 Implement ProductSearchController with multi-column filter without composite index
    - Create `Controllers/ProductSearchController.cs`
    - List endpoint: multi-column filter across StockItems + StockGroups + Suppliers without composite index
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 4.4_

  - [x] 4.7 Implement DashboardController with suboptimal LINQ aggregation
    - Create `Controllers/DashboardController.cs`
    - Aggregation endpoints: KPI calculations using LINQ that produces sort operations on large tables
    - No detail endpoint — aggregation only
    - _Requirements: 3.1, 4.5_

- [x] 5. Backend controllers — Optimized controllers
  - [x] 5.1 Implement SuppliersController (optimized)
    - Create `Controllers/SuppliersController.cs`
    - List endpoint with eager loading, column projection, pagination
    - Detail endpoint, Lookup endpoint for categories
    - Maintain identical code style to naive controllers
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.6_

  - [x] 5.2 Implement PurchaseOrdersController (optimized)
    - Create `Controllers/PurchaseOrdersController.cs`
    - List endpoint with proper joins and pagination
    - Detail endpoint with related lines and supplier
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.6_

  - [x] 5.3 Implement DeliveryController (optimized)
    - Create `Controllers/DeliveryController.cs`
    - List endpoint with driver join, proper eager loading
    - Detail endpoint
    - Lookup endpoint: drivers dropdown
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.6_

  - [x] 5.4 Implement WarehouseController (optimized)
    - Create `Controllers/WarehouseController.cs`
    - List endpoint: stock item transactions with proper joins
    - Detail endpoint
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.6_

  - [x] 5.5 Implement PaymentController (optimized)
    - Create `Controllers/PaymentController.cs`
    - List endpoint: customer transactions with customer join
    - Detail endpoint
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.6_

- [x] 6. Backend middleware and health check
  - [x] 6.1 Implement ExceptionHandlingMiddleware
    - Create `Middleware/ExceptionHandlingMiddleware.cs`
    - Map `EntityNotFoundException` → 404 with resource type and ID
    - Map `ValidationException` → 400 with validation message
    - Map `SqlException` (connection) → 503 with errorCode and message
    - Map unhandled exceptions → 500 with generic message
    - Register middleware in `Startup.cs`
    - _Requirements: 3.4, 3.5, 2.3_

  - [x] 6.2 Implement health check endpoint
    - Add `/health` endpoint that tests database connectivity
    - Return 200 `{"status": "healthy"}` when DB is reachable
    - Return 503 `{"status": "unhealthy", "error": "..."}` when DB is unreachable
    - _Requirements: 2.4_

- [x] 7. Checkpoint — Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend project scaffolding
  - [x] 8.1 Create Angular 18 project with routing and core module
    - Initialize Angular 18 project in `frontend/` folder
    - Set up `AppModule`, `AppRoutingModule` with routes for all 12 pages
    - Create `core/` module with services and interceptors directories
    - Create `environments/environment.ts` and `environment.prod.ts` with placeholder URLs
    - _Requirements: 10.2, 9.4_

  - [x] 8.2 Implement timing interceptor and timing service
    - Create `core/interceptors/timing.interceptor.ts` measuring request duration via `performance.now()`
    - Create `core/services/timing.service.ts` to store last response time
    - Register interceptor in AppModule HTTP_INTERCEPTORS
    - Handle error case: set "Request failed" on HTTP errors or timeout
    - Configure 10-second timeout on all HTTP requests
    - _Requirements: 12.1, 12.3, 12.6_

  - [x] 8.3 Implement API service with paginated response model
    - Create `core/services/api.service.ts` as base HTTP client
    - Create `core/models/paginated-response.ts` interface
    - Create `core/models/lookup-item.ts` interface
    - _Requirements: 5.2, 5.4_

- [x] 9. Frontend theme and shared components
  - [x] 9.1 Implement dark mode theme with SCSS variables
    - Create `styles.scss` with CSS variables: `$bg-main: #121212`, `$bg-sidebar: #1a1a1a`, `$bg-surface: #2a2a2a`, `$color-primary: #aaff00`, `$color-text: #ffffff`, `$color-text-secondary: #b0b0b0`
    - Apply global styles to body, navigation, cards, tables
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.2 Implement ResponseTimeBadge shared component
    - Create `shared/components/response-time-badge/` component
    - Input: `timeMs: number | null`, `error: boolean`
    - Display "Loaded in {time}ms" or "Request failed"
    - Use accent color `#aaff00`, minimum 16px font
    - Animate on value change (300-600ms highlight)
    - _Requirements: 12.2, 12.4, 12.5, 12.6_

  - [x] 9.3 Implement DataTable shared component
    - Create `shared/components/data-table/` component
    - Input: `columns: ColumnDef[]`, `data: any[]`, `loading: boolean`
    - Paginated table with dark theme styling, sort indicators
    - _Requirements: 5.1, 6.4_

  - [x] 9.4 Implement DropdownFilter shared component
    - Create `shared/components/dropdown-filter/` component
    - Input: `options: LookupItem[]`, `placeholder: string`
    - Output: `selectionChange: EventEmitter<number>`
    - Dark theme surface colors styling
    - _Requirements: 5.3, 5.4_

  - [x] 9.5 Implement ErrorMessage shared component
    - Create `shared/components/error-message/` component
    - Displays user-visible error message on API failures
    - Retains previously displayed data context
    - _Requirements: 5.6_

- [x] 10. Frontend pages — first batch
  - [x] 10.1 Implement Dashboard page
    - Create `pages/dashboard/` module and component
    - KPI summary cards with numeric values from aggregation endpoints
    - At least one chart visualization (e.g., Chart.js or ng2-charts)
    - Response time badge integration
    - _Requirements: 5.5, 5.2_

  - [x] 10.2 Implement Orders page
    - Create `pages/orders/` module and component
    - Data table with pagination, customer and product dropdown filters
    - Detail view for individual orders
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.3 Implement Sales Report page
    - Create `pages/sales-report/` module and component
    - Data table with customer, product, and date range filters
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.4 Implement Product Search page
    - Create `pages/product-search/` module and component
    - Data table with supplier, category, price range filters
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.5 Implement Customers page
    - Create `pages/customers/` module and component
    - Data table with pagination, detail view
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 10.6 Implement Suppliers page
    - Create `pages/suppliers/` module and component
    - Data table with category filter, detail view
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 11. Frontend pages — second batch
  - [x] 11.1 Implement Purchase Orders page
    - Create `pages/purchase-orders/` module and component
    - Data table with supplier and product filters, detail view
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.2 Implement Inventory/Stock page
    - Create `pages/inventory/` module and component
    - Data table with supplier and category filters
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.3 Implement Invoices page
    - Create `pages/invoices/` module and component
    - Data table with customer and date range filters, detail view
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.4 Implement Deliveries page
    - Create `pages/deliveries/` module and component
    - Data table with driver and date range filters, detail view
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.5 Implement Warehouse page
    - Create `pages/warehouse/` module and component
    - Data table with stock item filter
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 11.6 Implement Payments page
    - Create `pages/payments/` module and component
    - Data table with customer and status filters
    - Response time badge
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Checkpoint — Frontend pages complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. SQL audit and reset scripts
  - [x] 13.1 Create SQL audit scripts (6 files)
    - Create `scripts/audit/01-wait-stats.sql` — wait statistics from sys.dm_os_wait_stats
    - Create `scripts/audit/02-top-io-queries.sql` — top IO queries from sys.dm_exec_query_stats
    - Create `scripts/audit/03-current-indexes.sql` — existing indexes from sys.indexes
    - Create `scripts/audit/04-index-usage-stats.sql` — index usage from sys.dm_db_index_usage_stats
    - Create `scripts/audit/05-missing-indexes.sql` — missing index recommendations from sys.dm_db_missing_index_details
    - Create `scripts/audit/06-index-fragmentation.sql` — fragmentation from sys.dm_db_index_physical_stats
    - Each script limited to 50 result rows with clear column aliases
    - All scripts reference only WideWorldImporters schema objects and system DMVs
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 13.2 Create demo reset script
    - Create `scripts/reset/demo-reset.sql`
    - Drop all non-default indexes (use naming convention or baseline comparison with IF EXISTS)
    - Execute `DBCC FREEPROCCACHE` and `DBCC DROPCLEANBUFFERS`
    - Output status message per step
    - Ensure idempotence — safe to run multiple times
    - TRY/CATCH blocks with status output on failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 14. Backend testing setup and integration tests
  - [x] 14.1 Create integration test project structure
    - Create `backend/WideWorldImporters.IntegrationTests/WideWorldImporters.IntegrationTests.csproj` with xUnit, WebApplicationFactory, and FsCheck references
    - Create `TestWebApplicationFactory.cs` that configures in-process hosting with real SQL Server connection
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 14.2 Implement integration tests for all 12 controllers
    - Create test files for each controller in `Controllers/` subfolder
    - Per controller: test list endpoint (HTTP 200, valid JSON, pagination), test detail with valid ID (HTTP 200, correct fields), test detail with non-existent ID (HTTP 404, error field), test detail with malformed ID (HTTP 400, validation error), test lookup endpoint (JSON array with id + name)
    - Test database unavailable scenario (HTTP 503 with errorCode and message)
    - _Requirements: 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_

  - [x] 14.3 Write property test for pagination invariant
    - **Property 1: Pagination invariant**
    - Random page (1-50), random pageSize (1-100), random controller selection
    - Verify data array length ≤ pageSize, response contains page/pageSize/totalCount
    - **Validates: Requirements 3.2, 13.5**

  - [x] 14.4 Write property test for detail endpoint returns related data
    - **Property 2: Detail endpoint returns entity with related data**
    - Random valid IDs from each controller's domain
    - Verify HTTP 200 with entity fields plus related entities
    - **Validates: Requirements 3.3, 13.6**

  - [x] 14.5 Write property test for 404 on non-existent identifiers
    - **Property 3: Error response consistency for not-found identifiers**
    - Random large integers (> max existing ID) across all controllers
    - Verify HTTP 404 with error field containing resource type and identifier
    - **Validates: Requirements 3.4, 13.7**

  - [x] 14.6 Write property test for 400 on malformed identifiers
    - **Property 4: Error response consistency for malformed identifiers**
    - Random non-numeric strings (alpha, special chars, empty) across all controllers
    - Verify HTTP 400 with error field describing validation failure
    - **Validates: Requirements 3.5, 13.8**

  - [x] 14.7 Write property test for lookup endpoint constraints
    - **Property 5: Lookup endpoint size and shape constraint**
    - Iterate all lookup endpoints
    - Verify JSON array ≤ 1000 items, each with numeric id and non-empty string name
    - **Validates: Requirements 3.6, 13.10**

  - [x] 14.8 Write property test for 503 when database unavailable
    - **Property 6: Database unavailability produces 503 for all endpoints**
    - Random endpoint selection with DB connection severed
    - Verify HTTP 503 with errorCode and message fields
    - **Validates: Requirements 2.3, 2.4, 13.9**

  - [x] 14.9 Write property test for health check connectivity
    - **Property 7: Health check reflects live database connectivity**
    - Toggle DB connectivity, verify health endpoint response matches state
    - **Validates: Requirements 2.4**

  - [x] 14.10 Write property test for demo reset idempotence
    - **Property 11: Demo reset script idempotence**
    - Run reset script N times (random N between 1-5), verify no errors
    - **Validates: Requirements 7.4**

- [x] 15. Checkpoint — Backend tests complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Frontend E2E tests with Playwright
  - [x] 16.1 Set up Playwright configuration and test structure
    - Create `frontend/playwright.config.ts` with base URL, timeouts, browser configs
    - Create `frontend/e2e/` folder structure
    - Install Playwright dependencies in `package.json`
    - _Requirements: 14.1, 14.2_

  - [x] 16.2 Implement navigation E2E tests
    - Create `e2e/navigation.spec.ts`
    - Verify all 12 pages reachable via nav menu links
    - _Requirements: 14.3_

  - [x] 16.3 Implement data loading E2E tests
    - Create `e2e/data-loading.spec.ts`
    - Verify data appears in tables/lists within 10 seconds of navigation
    - _Requirements: 14.4_

  - [x] 16.4 Implement filter interaction E2E tests
    - Create `e2e/filters.spec.ts`
    - Test dropdown selection triggers data refresh on at least 3 pages
    - _Requirements: 14.5_

  - [x] 16.5 Implement response time badge E2E tests
    - Create `e2e/response-time.spec.ts`
    - Verify badge visible with "Loaded in {number}ms" pattern on all data pages
    - _Requirements: 14.6_

  - [x] 16.6 Implement theme verification E2E tests
    - Create `e2e/theme.spec.ts`
    - Verify background `#121212`, accent `#aaff00`, surface `#2a2a2a`
    - _Requirements: 14.7_

  - [x] 16.7 Implement error handling E2E tests
    - Create `e2e/error-handling.spec.ts`
    - Verify error message when backend unavailable, previous data retained
    - _Requirements: 14.8_

  - [x] 16.8 Implement dashboard E2E tests
    - Create `e2e/dashboard.spec.ts`
    - Verify KPI cards with numeric values and chart DOM element presence
    - _Requirements: 14.9_

- [x] 17. Security cleanup and documentation
  - [x] 17.1 Security audit and .gitignore finalization
    - Verify no hardcoded credentials in any file
    - Ensure all `.example` template files use placeholder values
    - Verify `.gitignore` covers all sensitive files
    - Create `frontend/src/environments/environment.prod.example.ts` with placeholder URLs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 17.2 Create root README.md
    - Document folder structure, prerequisites (Node 18+, .NET 5 SDK, Docker)
    - Provide steps to build and run backend, frontend, and database independently
    - Include instructions for running tests and audit scripts
    - _Requirements: 10.5_

- [x] 18. Final checkpoint — All components integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests and integration tests validate specific examples and edge cases
- The backend uses C# (.NET 5) and the frontend uses TypeScript (Angular 18)
- All naive controllers must maintain identical code style to optimized ones (Requirement 4.6, 4.7)
- Docker SQL Server must use WideWorldImporters-Full.bak for sufficient dataset size (Requirement 11.2)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "8.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "9.1"] },
    { "id": 2, "tasks": ["2.2", "8.2", "8.3", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 3, "tasks": ["3.1", "3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4"] },
    { "id": 5, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 6, "tasks": ["6.1", "6.2"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] },
    { "id": 8, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "13.1", "13.2"] },
    { "id": 9, "tasks": ["14.1", "16.1"] },
    { "id": 10, "tasks": ["14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8", "14.9", "14.10"] },
    { "id": 11, "tasks": ["16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8"] },
    { "id": 12, "tasks": ["17.1", "17.2"] }
  ]
}
```
