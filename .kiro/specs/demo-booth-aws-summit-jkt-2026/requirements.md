# Requirements Document

## Introduction

This document captures requirements for a demo booth application for AWS Summit Jakarta 2026. The application demonstrates SQL Server query optimization on .NET Core assisted by Kiro AI. It consists of an ASP.NET Core Web API backend connected to a WideWorldImporters database, and an Angular 18 frontend with dark-mode UI that visually displays query performance before and after optimization. The project is designed to be 100% safe for public demonstration with no confidential references.

## Glossary

- **Backend**: The ASP.NET Core 5 Web API application located in the `backend/` folder
- **Frontend**: The Angular 18 application located in the `frontend/` folder
- **WideWorldImporters**: Microsoft's official sample OLTP database used as the project dataset
- **Controller**: An ASP.NET Core API controller exposing HTTP endpoints
- **Naive_Query**: An intentionally unoptimized database query pattern (N+1, SELECT *, missing index, no pagination) used as the "before" state in demo
- **Response_Time_Badge**: A UI element displaying elapsed time in milliseconds for an API call
- **DMV**: Dynamic Management Views — built-in SQL Server views for performance diagnostics
- **Audit_Script**: A SQL script using DMVs to identify performance bottlenecks
- **Docker_Container**: A local SQL Server instance running via Docker for development
- **Demo_Reset_Script**: A SQL script that restores the database to its initial state between demo sessions
- **Integration_Test_Project**: A separate .NET test project that tests Backend API endpoints in-process using WebApplicationFactory against a real SQL Server database
- **Playwright_Test_Suite**: A collection of Playwright end-to-end tests that verify the Frontend user experience across all pages against the full running stack

## Requirements

### Requirement 1: Local Database Environment

**User Story:** As a developer, I want a Docker-based local SQL Server with WideWorldImporters pre-loaded, so that I can develop and demo without depending on cloud infrastructure.

#### Acceptance Criteria

1. THE Docker_Container SHALL run Microsoft SQL Server with the WideWorldImporters database restored from the official WideWorldImporters-Full.bak backup file, persisting data via a Docker volume so that the database survives container restarts without re-restoration; the acceptance criterion is satisfied when the WideWorldImporters database is functionally available and accepting connections (explicit Docker RUNNING status check is not required)
2. WHEN a developer runs `docker-compose up` from the repository root, THE Docker_Container SHALL start a SQL Server instance that accepts connections on its mapped port and responds to queries against the WideWorldImporters database within 60 seconds
3. IF the Docker_Container fails to start or the WideWorldImporters database is not available after 60 seconds, THEN THE Docker_Container SHALL exit with a non-zero status code and produce log output indicating the failure reason
4. THE Backend SHALL read the database connection string from `appsettings.Development.json` for local development and from `appsettings.Production.json` for AWS deployment
5. THE repository SHALL include an `appsettings.Development.json.example` file containing a template connection string with placeholder values for host, port, database name, username, and password that matches the Docker SQL Server container configuration

### Requirement 2: Production Database Environment

**User Story:** As a demo operator, I want an AWS-hosted SQL Server instance, so that I can run the demo in a cloud environment at the booth with reliable performance.

#### Acceptance Criteria

1. WHILE the environment variable `ASPNETCORE_ENVIRONMENT` is set to `Production`, THE Backend SHALL connect to an AWS RDS SQL Server instance or EC2 SQL Server instance using the production connection string with a connection timeout of 10 seconds
2. THE Backend SHALL resolve the production connection string by reading environment variables first, falling back to `appsettings.Production.json` if no environment variable is set for the connection string
3. IF the production database connection fails or the connection timeout of 10 seconds is exceeded, THEN THE Backend SHALL return a JSON error response containing an error code field and a human-readable message field with HTTP 503 status code
4. WHEN the Backend starts in production mode, THE Backend SHALL expose a health-check endpoint that returns HTTP 200 if the database connection is active or HTTP 503 if the database is unreachable

### Requirement 3: Backend API Controllers

**User Story:** As a demo presenter, I want 8-12 API controllers covering orders, sales, products, customers, suppliers, purchases, stock, invoices, deliveries, dashboard, warehouse, and payments, so that the codebase is realistically large and finding slow queries requires genuine effort.

#### Acceptance Criteria

1. THE Backend SHALL expose 12 API controllers: Orders, SalesReport, ProductSearch, Customers, Suppliers, PurchaseOrders, StockItems, Invoices, Delivery, Dashboard, Warehouse, and Payment, each providing at minimum one list endpoint and one detail endpoint (except Dashboard which provides aggregation endpoints only)
2. WHEN a list endpoint is called, THE Backend SHALL return paginated data from the WideWorldImporters database, joining at least one related table per controller as defined by the controller-to-schema mapping (e.g., Orders joins Sales.Orders + Sales.OrderLines + Warehouse.StockItems), with a default page size of 20 and a maximum page size of 100
3. WHEN a detail endpoint is called with a valid identifier, THE Backend SHALL return the entity's own fields plus its directly related entities (one level of navigation properties) in a JSON response
4. IF a detail endpoint is called with a non-existent identifier, THEN THE Backend SHALL return HTTP 404 with a JSON response body containing an error field that indicates the resource type and the identifier that was not found
5. IF an endpoint is called with a malformed identifier (non-numeric when numeric is expected, or invalid format), THEN THE Backend SHALL return HTTP 400 with a JSON response body containing an error field that indicates the validation failure reason
6. THE Backend SHALL include lookup endpoints that return filter options (customers list, product list, supplier list, category list, driver list), each returning at most 1000 items containing an identifier and a display name field

### Requirement 4: Intentionally Naive Query Patterns

**User Story:** As a demo presenter, I want several controllers to contain intentionally slow query patterns, so that I can demonstrate how Kiro identifies and fixes performance issues.

#### Acceptance Criteria

1. THE Backend SHALL contain N+1 query patterns in at least 2 controllers where related entities are loaded individually inside a loop (executing at least 10 separate queries per request on the standard WideWorldImporters dataset) instead of using eager loading or joins
2. THE Backend SHALL contain SELECT * patterns in at least 2 controllers where all columns of a table are retrieved but the endpoint response uses fewer than 50% of those columns
3. THE Backend SHALL contain at least 2 dropdown/lookup endpoints that load all records from a table (containing at least 500 rows in WideWorldImporters) without pagination or row limiting
4. THE Backend SHALL contain at least 2 list endpoints with joins across 3 or more tables where the filtered or joined columns lack a covering or composite index, resulting in table scans visible in the SQL Server execution plan
5. THE Backend SHALL contain at least 1 controller using LINQ expressions that translate into SQL execution plans with table scans or sort operations on tables exceeding 1000 rows where an index seek would be applicable
6. WHILE the remaining controllers use optimized patterns (eager loading, column projection, indexed joins, paginated lookups), THE Backend SHALL maintain identical code style, file structure, naming conventions, and dependency injection patterns across all controllers so that naive and optimized controllers are not distinguishable by structure alone; WHERE structural consistency conflicts with complete stealth, THE Backend SHALL prioritize structural consistency over making patterns undetectable
7. THE Backend SHALL NOT contain comments, variable names, class names, or documentation that indicate which controllers have intentionally naive query patterns

### Requirement 5: Frontend Pages

**User Story:** As a demo audience member, I want to see a multi-page enterprise-style application, so that the demo feels realistic and representative of real-world optimization scenarios.

#### Acceptance Criteria

1. THE Frontend SHALL include a navigation menu with links to the following 12 pages: Dashboard, Orders, Sales Report, Product Search, Customers, Suppliers, Purchase Orders, Inventory/Stock, Invoices, Deliveries, Warehouse, and Payments, where each link navigates to a distinct routed page displaying page-specific content
2. WHEN a page loads data from the Backend, THE Frontend SHALL display a Response_Time_Badge showing elapsed time in milliseconds (format: "Loaded in Xms")
3. THE Frontend SHALL include dropdown filter controls on the following pages with their respective filters: Orders (customer, product), Sales Report (customer, product, date range), Product Search (supplier, category, price range), Suppliers (category), Purchase Orders (supplier, product), Inventory/Stock (supplier, category), Invoices (customer, date range), Deliveries (driver, date range), Warehouse (stock item), Payments (customer, status)
4. WHEN a user selects a dropdown filter value, THE Frontend SHALL make a new Backend HTTP request with the selected filter parameter and replace the currently displayed data with the filtered results; THE Frontend SHALL NOT serve filter results from local cache or previously fetched data
5. THE Dashboard page SHALL display KPI summary cards and at least one chart visualization populated with data from the Backend
6. IF a Backend call fails or does not respond within 10 seconds, THEN THE Frontend SHALL display an error message indicating the failure and retain any previously displayed data on the page

### Requirement 6: Dark Mode UI Theme

**User Story:** As a booth designer, I want a modern dark-mode UI with green accent, so that the application is visually eye-catching on booth screens.

#### Acceptance Criteria

1. THE Frontend SHALL use `#121212` as the main application background color and `#1a1a1a` as the sidebar/navigation background color
2. THE Frontend SHALL use `#aaff00` as the primary/accent color for buttons, links, active navigation states, badges, and the Response_Time_Badge
3. THE Frontend SHALL use white (`#ffffff`) as the primary text color with `#b0b0b0` for secondary/descriptive text to establish visual hierarchy
4. THE Frontend SHALL use `#2a2a2a` as the surface color for cards, table rows, modals, and elevated components to create visual layering against the main background
5. THE Frontend dark mode theme SHALL be applied consistently to all application pages regardless of count, including tables, forms, dropdowns, chart backgrounds, and navigation elements

### Requirement 7: Demo Reset Capability

**User Story:** As a demo operator, I want to quickly reset the database state between demo sessions, so that each demo starts with consistent slow-query behavior.

#### Acceptance Criteria

1. THE Demo_Reset_Script SHALL restore the WideWorldImporters database to its pre-optimization state by dropping all indexes added during the optimization demo and completing execution within 30 seconds
2. WHEN the demo reset is executed, THE Demo_Reset_Script SHALL clear the SQL Server procedure cache and clear the buffer pool to ensure query plans are regenerated and cold-cache behavior is consistent across demo sessions
3. THE repository SHALL include the Demo_Reset_Script as a SQL file in a designated `scripts/` folder
4. THE Demo_Reset_Script SHALL be idempotent, executing without error regardless of whether the database is already in its pre-optimization state or has been partially or fully optimized
5. IF the Demo_Reset_Script encounters an error during execution, THEN THE Demo_Reset_Script SHALL output a message indicating which reset step failed and whether the database state is fully reset or partially reset

### Requirement 8: SQL Audit Scripts

**User Story:** As a demo presenter, I want generic DMV-based audit scripts, so that I can demonstrate the standard SQL Server performance analysis workflow during the booth demo.

#### Acceptance Criteria

1. THE Audit_Script collection SHALL include exactly 6 separate `.sql` files covering: wait statistics, top IO queries, current indexes, index usage statistics, missing index recommendations, and index fragmentation analysis
2. Each Audit_Script file SHALL be named with a numeric prefix indicating execution order (e.g., `01-wait-stats.sql`, `02-top-io-queries.sql`) and stored in the `scripts/` folder of the repository
3. THE Audit_Script collection SHALL reference only `WideWorldImporters` schema objects and system DMVs, with no references to any other user database, external server, or confidential data
4. Each Audit_Script SHALL produce query output with column aliases that clearly label each returned value, limited to no more than 50 result rows per script, suitable for screen-sharing readability
5. WHEN executed against WideWorldImporters with Naive_Query patterns active, THE Audit_Script for top IO queries SHALL return the intentionally slow queries within the top 10 results ranked by total logical reads
6. IF an Audit_Script is executed against a SQL Server instance where WideWorldImporters is not present, THEN the script SHALL fail with a standard SQL Server database-not-found error without modifying any system state
7. Each Audit_Script SHALL complete execution within 30 seconds when run against the WideWorldImporters database

### Requirement 9: Repository Security and Cleanliness

**User Story:** As a project owner, I want the repository to contain zero confidential information, so that it is safe to display publicly at the AWS Summit booth.

#### Acceptance Criteria

1. THE repository SHALL NOT contain any hardcoded database credentials, API keys, AWS account IDs, RDS endpoint addresses, connection strings with real passwords, or secret tokens in any committed file across all branches
2. THE repository SHALL use placeholder values following a recognizable pattern (e.g., `YOUR_API_KEY_HERE`, `<placeholder>`, or user-secrets references) for all sensitive configuration including database hosts, passwords, API keys, and account identifiers
3. THE repository SHALL NOT contain any references to confidential office projects, internal database names, or proprietary code in file contents, comments, variable names, folder names, or git commit messages across the entire commit history
4. THE Frontend environment files (`environment.ts`, `environment.prod.ts`) SHALL contain only placeholder URLs (e.g., `http://localhost` or `https://example.com`) and no real production endpoints or credentials in committed code
5. THE repository SHALL include `.gitignore` entries for `appsettings.Development.json`, `appsettings.Production.json`, and Angular environment files containing real values, and SHALL provide corresponding `.example` template files (e.g., `appsettings.Development.example.json`, `environment.prod.example.ts`) containing placeholder values to guide developer setup
6. THE repository git history SHALL NOT contain any previously committed secrets, AWS account IDs, real database endpoints, or confidential project references in any prior commit reachable from any branch

### Requirement 10: Monorepo Structure

**User Story:** As a developer, I want a clear monorepo layout with separate backend and frontend folders, so that the project is easy to navigate and each part can be built independently.

#### Acceptance Criteria

1. THE repository SHALL contain a `backend/` folder with at minimum a `.csproj` file, a `Program.cs` file, and a `Controllers/` folder for the ASP.NET Core 5 Web API project
2. THE repository SHALL contain a `frontend/` folder with at minimum an `angular.json` file, a `package.json` file, and a `src/` folder for the Angular 18 application
3. THE repository SHALL contain a `scripts/` folder with `.sql` files separated into an `audit/` subfolder for audit-related scripts and a `reset/` subfolder for demo reset scripts
4. THE repository SHALL contain a `docker-compose.yml` file at the root that defines a SQL Server service for local development
5. THE repository SHALL contain a root `README.md` file that describes the folder structure, lists prerequisites, and provides steps to build and run the backend, frontend, and database independently

### Requirement 11: Reproducible Slow Query Behavior

**User Story:** As a demo presenter, I want the slow queries to consistently exhibit poor performance across demo sessions, so that the before/after comparison is reliable and convincing.

#### Acceptance Criteria

1. WHEN the Demo_Reset_Script has been executed, THE Backend Naive_Query endpoints SHALL produce response times at minimum 3x slower than their optimized equivalents, measured from request sent to response received
2. THE WideWorldImporters dataset SHALL use the Full backup version (WideWorldImporters-Full.bak) containing at minimum 200,000 rows in key queried tables (such as Sales.OrderLines, Sales.InvoiceLines) so that Naive_Query patterns produce response times of at least 1 second without artificial delays (no deliberate sleep or throttling in code)
3. WHEN `DBCC FREEPROCCACHE` and `DBCC DROPCLEANBUFFERS` are executed before a demo session, THE Backend SHALL regenerate query plans and reload data from disk, ensuring that response times for the same Naive_Query endpoint vary by no more than ±30% between consecutive cold-start runs
4. IF a Naive_Query endpoint produces a response time less than 3x slower than its optimized equivalent after cache clearing, THEN THE System SHALL indicate the performance ratio in its response metadata so the presenter can identify insufficient degradation

### Requirement 12: Response Time Measurement

**User Story:** As a demo audience member, I want to see exact response times on screen, so that I can visually confirm the improvement after optimization without needing developer tools.

#### Acceptance Criteria

1. WHEN the Frontend makes an API call, THE Frontend SHALL measure elapsed time from request initiation to response completion using a high-resolution client-side timer with millisecond precision
2. THE Response_Time_Badge SHALL display the measured time as a whole integer in milliseconds with the format "Loaded in {time}ms"
3. WHEN new data is loaded (page navigation or filter change), THE Response_Time_Badge SHALL update to reflect the latest request duration immediately upon response completion
4. THE Response_Time_Badge SHALL be displayed in a fixed, consistent position across all data-displaying pages using the primary accent color (`#aaff00`) with a minimum font size of 16px
5. WHEN the Response_Time_Badge value changes (including transitions from a timing display to an error message or from an error message to a timing display), THE Response_Time_Badge SHALL play a brief highlight animation lasting between 300ms and 600ms to draw audience attention to the updated value
6. IF an API call fails or times out before receiving a response, THEN THE Response_Time_Badge SHALL display "Request failed" instead of a time value; IF failure detection is uncertain or delayed, THEN THE Response_Time_Badge SHALL default to displaying "Request failed"

### Requirement 13: Backend Integration Testing

**User Story:** As a developer, I want integration tests for the backend API endpoints, so that I can verify API behavior end-to-end against a real database and catch regressions before deployment.

#### Acceptance Criteria

1. THE Backend SHALL include a separate integration test project (located in `backend/tests/` or `backend/*.IntegrationTests/`) that references the main Web API project and is runnable via `dotnet test` from the `backend/` folder
2. THE Integration_Test_Project SHALL use WebApplicationFactory or TestServer to host the Backend in-process, enabling HTTP request/response testing without requiring a separately running API process
3. THE Integration_Test_Project SHALL execute tests against a real SQL Server instance running in a Docker container (from the project's docker-compose or a test-specific container), not an in-memory or mocked database
4. THE Integration_Test_Project SHALL include at least one list endpoint test and one detail endpoint test for each of the 12 controllers (Orders, SalesReport, ProductSearch, Customers, Suppliers, PurchaseOrders, StockItems, Invoices, Delivery, Dashboard, Warehouse, Payment)
5. WHEN a list endpoint is called with valid parameters, THE Integration_Test_Project SHALL verify that the response returns HTTP 200, the response body is valid JSON, and the response contains a paginated collection with default page size of 20 and maximum page size of 100
6. WHEN a detail endpoint is called with a valid identifier, THE Integration_Test_Project SHALL verify that the response returns HTTP 200 and the response body contains the required fields for the entity type
7. WHEN a detail endpoint is called with a non-existent identifier, THE Integration_Test_Project SHALL verify that the response returns HTTP 404 with a JSON body containing an error field
8. WHEN an endpoint is called with a malformed identifier, THE Integration_Test_Project SHALL verify that the response returns HTTP 400 with a JSON body containing a validation error description
9. IF the database is unreachable during test execution, THEN THE Integration_Test_Project SHALL verify that all endpoints return HTTP 503 with a JSON error response, regardless of whether the endpoint requires database access
10. THE Integration_Test_Project SHALL include tests for lookup/dropdown endpoints verifying that each returns a JSON array of objects containing at minimum an identifier field and a display name field

### Requirement 14: Frontend E2E Testing with Playwright

**User Story:** As a developer, I want end-to-end tests using Playwright for the frontend, so that I can verify the complete user flow across all pages including navigation, data loading, filtering, and response time display.

#### Acceptance Criteria

1. THE Frontend SHALL include a Playwright test configuration file (`playwright.config.ts`) in the `frontend/` folder; the configuration file SHALL exist and be properly configured as a standalone acceptance criterion, while the full running stack (Backend and database) is required only for actual test execution
2. THE Playwright_Test_Suite SHALL be runnable via a single command (`npx playwright test`) from the `frontend/` folder
3. THE Playwright_Test_Suite SHALL include navigation tests that verify successful routing to all 12 pages (Dashboard, Orders, Sales Report, Product Search, Customers, Suppliers, Purchase Orders, Inventory/Stock, Invoices, Deliveries, Warehouse, Payments) via the navigation menu
4. WHEN a page loads data from the Backend, THE Playwright_Test_Suite SHALL verify that data appears in the page's table or list component within 10 seconds of navigation
5. THE Playwright_Test_Suite SHALL include dropdown filter interaction tests on at least 3 pages, verifying that selecting a filter value triggers a data refresh and the displayed data updates accordingly
6. WHEN a page finishes loading data, THE Playwright_Test_Suite SHALL verify that a Response_Time_Badge element is visible and displays text matching the pattern "Loaded in {number}ms" where the number is a positive integer
7. THE Playwright_Test_Suite SHALL verify the dark mode theme is applied by checking that the application background color is `#121212` and the primary accent color `#aaff00` is used on key interactive elements
8. IF the Backend is unavailable during a Playwright test run, THEN THE Playwright_Test_Suite SHALL include at least one test that verifies the Frontend displays a user-visible error message indicating a connection or loading failure
9. THE Playwright_Test_Suite SHALL include tests verifying the Dashboard page renders KPI summary cards with numeric values and at least one chart element is present in the DOM
10. THE Playwright_Test_Suite SHALL complete a full test run within 5 minutes when executed against a local full-stack environment (Backend, Frontend, and database running)

### Requirement 15: List Page Enhancements

**User Story:** As a demo audience member, I want list pages with full-featured search, pagination info, sorting, proper ID display, multi-select filters, CSV export, and row numbers, so that the application feels like a production-quality enterprise tool.

#### Acceptance Criteria

**15.1 — Search across all list pages**

1. WHEN a list page is displayed, THE Frontend SHALL render a search input field above the data table that allows the user to type a free-text search term
2. WHEN the user types a search term, THE Frontend SHALL send the search term to the Backend as a `search` query parameter along with the existing pagination and filter parameters
3. THE Backend SHALL filter results by matching the search term against common searchable text columns for the entity (e.g., customer name, product name, description) using a case-insensitive LIKE/Contains pattern
4. WHEN search is applied, THE pagination totalCount SHALL reflect the filtered result count (not the unfiltered total)
5. WHEN the user clears the search field, THE Frontend SHALL reload data without the search parameter, restoring the full (filter-only) result set

**15.2 — Pagination total display**

6. THE Frontend pagination section SHALL display the total number of records and total number of pages in a human-readable format (e.g., "Showing page 1 of 50 (1,000 records)")
7. WHEN filters or search are applied, THE displayed total records and total pages SHALL update to reflect the filtered/searched count

**15.3 — Backend sorting connected to frontend column ordering**

8. WHEN a user clicks a sortable column header in the DataTable, THE Frontend SHALL send `sortBy` and `sortDirection` query parameters to the Backend
9. THE Backend list endpoints SHALL accept optional `sortBy` (column name) and `sortDirection` (`asc` or `desc`) query parameters and apply ORDER BY accordingly in the database query
10. IF `sortBy` is not provided or is invalid, THE Backend SHALL use its default sort order for the endpoint
11. THE Frontend sort state (column indicator) SHALL accurately reflect the active sort applied by the Backend

**15.4 — ID column formatting fix**

12. THE Frontend SHALL display ID columns (e.g., orderId, customerId, invoiceId, etc.) as plain integers without thousand-separator formatting (e.g., `73506` not `73,506`)
13. THE ColumnDef model SHALL support a format type of `'id'` that renders the value as a plain integer without locale-based number formatting

**15.5 — Orders page date range filter**

14. THE Orders page SHALL include a start date and end date filter that filters orders by their order date
15. WHEN the user selects a date range, THE Frontend SHALL send `startDate` and `endDate` query parameters to the Backend, and THE Backend SHALL filter orders where `OrderDate` falls within the specified range (inclusive)

**15.6 — Separate detail page (instead of inline append)**

16. WHEN a user clicks a row in a list table, THE Frontend SHALL navigate to a separate detail page route (e.g., `/orders/:id`, `/customers/:id`) instead of appending detail content below the list
17. THE detail page SHALL display the full entity detail with related data, and include a back button or breadcrumb to return to the list page
18. THE detail page SHALL preserve the user's previous list state (page, filters, search) when navigating back

**15.7 — Multi-select dropdown filters**

19. THE dropdown filter component SHALL support multi-select mode where the user can select multiple values via checkboxes
20. WHEN multiple values are selected, THE Frontend SHALL send all selected IDs as a comma-separated list (e.g., `customerId=1,5,12`) to the Backend
21. THE Backend list endpoints SHALL accept comma-separated filter values and apply an IN clause to filter by multiple values
22. THE multi-select dropdown SHALL display a summary of selected items (e.g., "3 selected") when multiple values are chosen

**15.8 — Export to CSV**

23. THE Frontend SHALL display an "Export CSV" button on each list page
24. WHEN the user clicks "Export CSV", THE Frontend SHALL request all data from the Backend matching the current active filters (ignoring pagination and search), and generate a CSV file client-side from the JSON response
25. THE exported CSV SHALL include column headers matching the visible table columns and respect the active filter selections but NOT apply the search term
26. THE exported CSV file SHALL be downloaded automatically with a filename pattern of `{resource}-export-{YYYY-MM-DD}.csv`

**15.9 — Row number column**

27. THE Frontend SHALL display a sequential row number (No.) as the leftmost column in every list table
28. THE row number SHALL be calculated as `(page - 1) * pageSize + rowIndex + 1` so that numbering is continuous across pages
29. THE row number column SHALL NOT be sortable and SHALL have a fixed narrow width
