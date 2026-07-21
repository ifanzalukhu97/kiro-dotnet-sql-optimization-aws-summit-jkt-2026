# Implementation Plan

## Overview

Implement 13 Advanced Report endpoints in a new `AdvancedReportController`, a new frontend "Advanced Report" page with parallel-loading cards, fix the Inventory stock ordering bug in `StockItemsController`, and add comprehensive test coverage for all changes. Each change must ensure all existing tests continue to pass.

## Tasks

### Wave 0: Backend DTOs and Bugfix (parallel, no frontend dependencies)

- [ ] 1. Backend: Create AdvancedReportDtos
  - [ ] 1.1 Create `backend/WideWorldImporters.Api/Models/Dtos/AdvancedReportDtos.cs`
    - Add all 13 DTO classes: `TotalRevenueDto`, `TopCustomerDto`, `TopSalesmanDto`, `TopProductDto`, `CustomerActivityDto`, `SalesTrendDto`, `StockLevelDto`, `TopOutstandingDto`, `DormantCustomerDto`, `TopStockGroupDto`, `TopSupplierDto`, `TopDriverDto`
    - Each DTO has properties exactly as defined in the design document
    - _Requirements: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14_

- [ ] 2. Backend: Fix Inventory stock ordering bug
  - [ ] 2.1 Refactor `StockItemsController.GetStockItems` to join `StockItemHoldings` and `Suppliers` early in the query
    - Replace the current pattern (load StockItems → paginate → loop to load holdings/suppliers separately) with a single joined query
    - Join: `StockItems` JOIN `StockItemHoldings` ON StockItemID JOIN `Suppliers` ON SupplierID
    - Project directly to `StockItemListDto` from the joined result (no separate per-item queries)
    - Ensure `QuantityOnHand` is populated from the join (not hardcoded to 0)
    - Ensure `SupplierName` is populated from the join (not loaded separately)
    - _Requirements: 16.6_
    - _Preservation: All existing functionality (pagination, filters, search, export) must work identically_
  - [ ] 2.2 Update `ApplySort` in `StockItemsController` to support `quantityonhand` and `suppliername` sort columns
    - Add case `"quantityonhand"` → sort by `Holding.QuantityOnHand`
    - Add case `"suppliername"` → sort by `Supplier.SupplierName`
    - Keep all existing sort cases (`stockitemid`, `stockitemname`, `unitprice`, `recommendedretailprice`)
    - The method signature will need to change since sorting now operates on the joined type, not just `IQueryable<StockItem>`
    - _Requirements: 16.3, 16.4_
  - [ ] 2.3 Verify existing StockItems functionality works after refactor
    - Ensure `/api/stockitems?page=1&pageSize=20` returns same data structure as before
    - Ensure `/api/stockitems?supplierId=2` filter works
    - Ensure `/api/stockitems?search=USB` works
    - Ensure `/api/stockitems?export=true` works
    - Ensure `/api/stockitems?sortBy=stockitemname&sortDirection=desc` works
    - Ensure `/api/stockitems/{id}` detail endpoint is unaffected
    - Ensure `/api/stockitems/lookup` endpoint is unaffected
    - _Requirements: 16.4, 17.5_



### Wave 1: Backend AdvancedReportController (depends on Wave 0 Task 1)

- [ ] 3. Backend: Implement AdvancedReportController — Revenue and Rankings
  - [ ] 3.1 Create `backend/WideWorldImporters.Api/Controllers/AdvancedReportController.cs` with constructor injection of `WideWorldImportersContext`
    - Route prefix: `[Route("api/advancedreport")]`
    - _Requirements: 1.1_
  - [ ] 3.2 Implement `GET /api/advancedreport/total-revenue`
    - Calculate `invoiceRevenue = SUM(InvoiceLines.ExtendedPrice)`
    - Calculate `orderRevenue = SUM(OrderLines.Quantity * OrderLines.UnitPrice)`
    - Return `TotalRevenueDto` with totalRevenue = invoiceRevenue + orderRevenue
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ] 3.3 Implement `GET /api/advancedreport/top-customers`
    - Join InvoiceLines → Invoices → Customers
    - Group by CustomerID/CustomerName, sum ExtendedPrice
    - Order by TotalRevenue desc, take 10
    - Return `List<TopCustomerDto>`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ] 3.4 Implement `GET /api/advancedreport/top-salesman`
    - Join InvoiceLines → Invoices → People (on SalespersonPersonID)
    - Group by PersonID/FullName, sum ExtendedPrice
    - Order by TotalRevenue desc, take 10
    - Return `List<TopSalesmanDto>`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ] 3.5 Implement `GET /api/advancedreport/top-products`
    - Join InvoiceLines → StockItems
    - Group by StockItemID/StockItemName, sum ExtendedPrice and Quantity
    - Order by TotalRevenue desc, take 10
    - Return `List<TopProductDto>`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4. Backend: Implement AdvancedReportController — Customer Analytics
  - [ ] 4.1 Implement `GET /api/advancedreport/customer-activity`
    - Count total customers
    - Count distinct customers with orders in last 90 days
    - Calculate inactive = total - active
    - Calculate activePercentage = round((active/total)*100, 2)
    - Return `CustomerActivityDto`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ] 4.2 Implement `GET /api/advancedreport/top-outstanding`
    - Group CustomerTransactions by CustomerID, sum OutstandingBalance
    - Filter where balance > 0
    - Order by balance desc, take 10
    - Join with Customers for names
    - Return `List<TopOutstandingDto>`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ] 4.3 Implement `GET /api/advancedreport/dormant-customers`
    - Group Orders by CustomerID, get max OrderDate
    - Order by LastOrderDate asc (oldest first), take 10
    - Calculate DaysSinceLastOrder = (today - lastOrderDate).TotalDays
    - Join with Customers for names
    - Return `List<DormantCustomerDto>`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 5. Backend: Implement AdvancedReportController — Sales Trend
  - [ ] 5.1 Implement `GET /api/advancedreport/sales-trend?period=month|week|year`
    - Accept `[FromQuery] string period = "month"` parameter
    - For `month`: group by Year/Month for last 12 months, format as "YYYY-MM"
    - For `week`: group by ISO week for last 12 weeks, format as "YYYY-Www"
    - For `year`: group by Year for all available data, format as "YYYY"
    - Calculate revenue from InvoiceLines (joined with Invoices for date)
    - Calculate orderCount from Orders (distinct orders per period)
    - Return `List<SalesTrendDto>` ordered chronologically
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 6. Backend: Implement AdvancedReportController — Inventory Reports
  - [ ] 6.1 Implement `GET /api/advancedreport/low-stock`
    - Join StockItemHoldings → StockItems
    - Prefer items where QuantityOnHand <= ReorderLevel
    - If fewer than 10 match that criteria, fill up to 10 with lowest QuantityOnHand regardless
    - Order by QuantityOnHand asc, take 10
    - Return `List<StockLevelDto>`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 6.2 Implement `GET /api/advancedreport/high-stock`
    - Join StockItemHoldings → StockItems
    - Order by QuantityOnHand desc, take 10
    - Return `List<StockLevelDto>`
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 7. Backend: Implement AdvancedReportController — Supplier/Group/Driver Reports
  - [ ] 7.1 Implement `GET /api/advancedreport/top-stock-groups`
    - Join InvoiceLines → StockItemStockGroups → StockGroups
    - Group by StockGroupID, sum ExtendedPrice, count distinct StockItemIDs
    - Order by TotalRevenue desc, take 5
    - Return `List<TopStockGroupDto>`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [ ] 7.2 Implement `GET /api/advancedreport/top-suppliers`
    - Join InvoiceLines → StockItems (for SupplierID) → Suppliers
    - Group by SupplierID, sum ExtendedPrice, count distinct StockItemIDs
    - Order by TotalRevenue desc, take 5
    - Return `List<TopSupplierDto>`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [ ] 7.3 Implement `GET /api/advancedreport/top-drivers`
    - Join Invoices → People (where IsEmployee = true)
    - Group by PersonID/FullName, count invoices as DeliveryCount
    - Order by DeliveryCount desc, take 5
    - Calculate TotalRevenueDelivered per driver from InvoiceLines
    - Return `List<TopDriverDto>`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_



### Wave 2: Frontend — Advanced Report Page (depends on Wave 1)

- [ ] 8. Frontend: Create Advanced Report module and routing
  - [ ] 8.1 Create `frontend/src/app/pages/advanced-report/advanced-report.module.ts`
    - Declare and export `AdvancedReportComponent` and child components
    - Import `CommonModule`, `SharedModule`
    - _Requirements: 15.1_
  - [ ] 8.2 Create `frontend/src/app/pages/advanced-report/advanced-report-routing.module.ts`
    - Route: `{ path: '', component: AdvancedReportComponent }`
    - _Requirements: 15.1_
  - [ ] 8.3 Add lazy-loaded route in app-routing module
    - `{ path: 'advanced-report', loadChildren: () => import(...).then(m => m.AdvancedReportModule) }`
    - _Requirements: 15.1_
  - [ ] 8.4 Add "Advanced Report" navigation link in sidebar/nav component
    - Place between existing nav items (e.g., after Dashboard or at end)
    - Icon and styling consistent with other nav items
    - _Requirements: 15.1_

- [ ] 9. Frontend: Create Advanced Report models and service
  - [ ] 9.1 Create `frontend/src/app/pages/advanced-report/models/advanced-report.models.ts`
    - Define all 13 TypeScript interfaces as specified in design
    - _Requirements: 15.2_
  - [ ] 9.2 Create `frontend/src/app/pages/advanced-report/advanced-report.service.ts`
    - 13 methods, one per endpoint
    - `getSalesTrend(period: string)` accepts period parameter
    - Base URL: `${environment.apiUrl}/api/advancedreport`
    - _Requirements: 15.2_

- [ ] 10. Frontend: Create shared report card component
  - [ ] 10.1 Create `frontend/src/app/pages/advanced-report/components/report-card/` component
    - Inputs: `title: string`, `loading: boolean`, `error: string | null`, `responseTime: number | null`
    - Shows loading spinner when `loading = true`
    - Shows error message when `error != null`
    - Shows `<ng-content>` when loaded successfully
    - Shows ResponseTimeBadge with `responseTime`
    - Dark theme styling: `#2a2a2a` card background, `#aaff00` accent
    - _Requirements: 15.3, 15.4, 15.5, 15.7_

- [ ] 11. Frontend: Implement Advanced Report page component
  - [ ] 11.1 Create `advanced-report.component.ts` with parallel loading logic
    - State object per card: `{ data, loading, error, time }`
    - `ngOnInit` calls all 13 service methods simultaneously
    - Each call measures its own response time via `performance.now()`
    - Each call independently sets loading/data/error state
    - _Requirements: 15.2, 15.3, 15.5_
  - [ ] 11.2 Create `advanced-report.component.html` with responsive grid layout
    - Responsive grid: 3 columns on desktop (>1200px), 2 columns on tablet (>768px), 1 column on mobile
    - 13 `<app-report-card>` instances, each with appropriate content:
      - Total Revenue: large number + small breakdown (invoice/order)
      - Top 10/5 lists: ranking table with position number, name, metric
      - Customer Activity: numbers + percentage bar
      - Sales Trend: period selector dropdown + bar/line chart or simple table
      - Stock reports: table with name + quantity + levels
    - _Requirements: 15.6_
  - [ ] 11.3 Create `advanced-report.component.scss` with dark theme styling
    - Card grid layout with gap spacing
    - Consistent with app's dark theme (`#121212` bg, `#2a2a2a` cards, `#aaff00` accent)
    - _Requirements: 15.7_
  - [ ] 11.4 Add Sales Trend period selector (week/month/year)
    - Dropdown or button group to select period
    - On change: reload sales-trend endpoint with new period parameter
    - _Requirements: 7.1, 15.3_



### Wave 3: Backend Tests (depends on Wave 0 + Wave 1)

- [ ] 12. Backend: Integration tests for AdvancedReportController
  - [ ] 12.1 Create `backend/WideWorldImporters.IntegrationTests/Controllers/AdvancedReportControllerTests.cs`
    - Use same `IClassFixture<TestWebApplicationFactory>` pattern as other test files
    - _Requirements: 17.1_
  - [ ] 12.2 Test `GET /api/advancedreport/total-revenue`
    - Assert HTTP 200
    - Assert response has `totalRevenue`, `invoiceRevenue`, `orderRevenue` fields
    - Assert `totalRevenue == invoiceRevenue + orderRevenue`
    - Assert all values are non-negative decimals
    - _Requirements: 17.1, Property 2_
  - [ ] 12.3 Test `GET /api/advancedreport/top-customers`
    - Assert HTTP 200
    - Assert response is JSON array with length <= 10
    - Assert each item has `customerId`, `customerName`, `totalRevenue`
    - Assert ordering: item[i].totalRevenue >= item[i+1].totalRevenue
    - _Requirements: 17.1, Property 3, Property 4_
  - [ ] 12.4 Test `GET /api/advancedreport/top-salesman`
    - Assert HTTP 200, array <= 10, correct fields, descending order
    - _Requirements: 17.1, Property 3, Property 4_
  - [ ] 12.5 Test `GET /api/advancedreport/top-products`
    - Assert HTTP 200, array <= 10, correct fields (`stockItemId`, `stockItemName`, `totalRevenue`, `totalQuantitySold`), descending order
    - _Requirements: 17.1, Property 3, Property 4_
  - [ ] 12.6 Test `GET /api/advancedreport/customer-activity`
    - Assert HTTP 200
    - Assert response has `totalCustomers`, `activeCustomers`, `inactiveCustomers`, `activePercentage`
    - Assert `totalCustomers == activeCustomers + inactiveCustomers`
    - Assert `activePercentage` is between 0 and 100
    - _Requirements: 17.1, Property 5_
  - [ ] 12.7 Test `GET /api/advancedreport/sales-trend` with period=month, week, year
    - Assert HTTP 200 for each period value
    - Assert response is JSON array, each item has `periodLabel`, `revenue`, `orderCount`
    - Assert `periodLabel` format matches expected pattern per period type
    - Assert chronological ordering
    - _Requirements: 17.1, Property 6_
  - [ ] 12.8 Test `GET /api/advancedreport/low-stock`
    - Assert HTTP 200, array <= 10, correct fields, ascending order by quantityOnHand
    - _Requirements: 17.1_
  - [ ] 12.9 Test `GET /api/advancedreport/high-stock`
    - Assert HTTP 200, array <= 10, correct fields, descending order by quantityOnHand
    - _Requirements: 17.1_
  - [ ] 12.10 Test `GET /api/advancedreport/top-outstanding`
    - Assert HTTP 200, array <= 10, correct fields, all outstandingBalance > 0, descending order
    - _Requirements: 17.1, Property 3, Property 4_
  - [ ] 12.11 Test `GET /api/advancedreport/dormant-customers`
    - Assert HTTP 200, array <= 10, correct fields, ascending order by lastOrderDate
    - Assert `daysSinceLastOrder` is a positive integer
    - _Requirements: 17.1, Property 3, Property 4_
  - [ ] 12.12 Test `GET /api/advancedreport/top-stock-groups`
    - Assert HTTP 200, array <= 5, correct fields, descending order
    - _Requirements: 17.1, Property 3, Property 4_
  - [ ] 12.13 Test `GET /api/advancedreport/top-suppliers`
    - Assert HTTP 200, array <= 5, correct fields, descending order
    - _Requirements: 17.1, Property 3, Property 4_
  - [ ] 12.14 Test `GET /api/advancedreport/top-drivers`
    - Assert HTTP 200, array <= 5, correct fields (`personId`, `fullName`, `deliveryCount`, `totalRevenueDelivered`), descending order by deliveryCount
    - _Requirements: 17.1, Property 3, Property 4_

- [ ] 13. Backend: Integration tests for Inventory sort fix
  - [ ] 13.1 Add test to `StockItemsControllerTests.cs`: `GetStockItems_SortByQuantityOnHand_Asc_ReturnsOrderedResults`
    - Call `GET /api/stockitems?sortBy=quantityonhand&sortDirection=asc&pageSize=10`
    - Assert HTTP 200
    - Assert each item's `quantityOnHand` <= next item's `quantityOnHand`
    - _Requirements: 17.2, Property 7_
  - [ ] 13.2 Add test: `GetStockItems_SortByQuantityOnHand_Desc_ReturnsOrderedResults`
    - Call `GET /api/stockitems?sortBy=quantityonhand&sortDirection=desc&pageSize=10`
    - Assert each item's `quantityOnHand` >= next item's `quantityOnHand`
    - _Requirements: 17.2, Property 7_
  - [ ] 13.3 Add test: `GetStockItems_QuantityOnHand_IsPopulated`
    - Call `GET /api/stockitems?page=1&pageSize=5`
    - Assert at least one item has `quantityOnHand > 0` (proves join works)
    - _Requirements: 17.2_
  - [ ] 13.4 Run existing StockItems tests to verify no regression
    - `GetStockItems_ReturnsOkWithPaginatedJson` — still passes
    - `GetStockItem_WithValidId_ReturnsOkWithCorrectFields` — still passes
    - `GetStockItem_WithNonExistentId_Returns404WithError` — still passes
    - `GetStockItem_WithMalformedId_Returns400WithError` — still passes
    - `GetStockItemsLookup_ReturnsJsonArrayWithIdAndName` — still passes
    - _Requirements: 17.5, Property 8_



### Wave 4: Frontend E2E Tests (depends on Wave 2 + Wave 3)

- [ ] 14. Frontend: Playwright E2E tests for Advanced Report page
  - [ ] 14.1 Create `frontend/e2e/advanced-report.spec.ts`
    - _Requirements: 17.3_
  - [ ] 14.2 Test: Navigation — "Advanced Report" link in sidebar navigates to `/advanced-report`
    - Assert nav link exists with text "Advanced Report"
    - Click link, assert URL is `/advanced-report`
    - _Requirements: 17.3, 15.1_
  - [ ] 14.3 Test: Page loads with 13 report cards visible
    - Navigate to `/advanced-report`
    - Assert 13 report card elements exist (by CSS class or data-testid)
    - _Requirements: 17.3, 15.2_
  - [ ] 14.4 Test: Cards show data after loading (not perpetual spinner)
    - Wait for at least one card to show non-loading content (timeout 10s)
    - Assert at least one card contains numeric data
    - _Requirements: 17.3, 15.3_
  - [ ] 14.5 Test: Each card shows response time badge
    - After data loads, assert response time badge elements are visible
    - Assert badge text matches "Loaded in Xms" pattern
    - _Requirements: 17.3, 15.4_
  - [ ] 14.6 Test: Error isolation — one failed endpoint shows error only on that card
    - Intercept one endpoint (e.g., `/api/advancedreport/top-drivers`) with 500
    - Assert that specific card shows error message
    - Assert other cards still load data normally
    - _Requirements: 17.3, 15.5_
  - [ ] 14.7 Test: Sales Trend period selector works
    - Find period selector (dropdown/buttons)
    - Change from "month" to "week"
    - Assert card reloads with different data
    - _Requirements: 17.3, 7.1_
  - [ ] 14.8 Test: Dark theme applied to report cards
    - Assert card background color is `#2a2a2a` (or equivalent rgb)
    - Assert accent color `#aaff00` is used on key elements
    - _Requirements: 17.3, 15.7_

- [ ] 15. Frontend: Playwright E2E test for Inventory sorting by Quantity on Hand
  - [ ] 15.1 Add test to `frontend/e2e/` (new file `inventory-sort-fix.spec.ts` or add to existing)
    - Navigate to `/inventory`
    - Wait for data to load
    - Find "Qty on Hand" or "Quantity on Hand" column header
    - Click it to sort ascending
    - Assert data order changed (first row qty <= second row qty)
    - Click again for descending
    - Assert first row qty >= second row qty
    - _Requirements: 17.4_

### Wave 5: Final Verification (depends on all previous waves)

- [ ] 16. Run all existing tests to confirm no regressions
  - [ ] 16.1 Run `dotnet test` from `backend/` — ALL existing tests must pass
    - Including: OrdersControllerTests, CustomersControllerTests, InvoicesControllerTests, DeliveryControllerTests, StockItemsControllerTests, SuppliersControllerTests, PurchaseOrdersControllerTests, DashboardControllerTests, WarehouseControllerTests, PaymentControllerTests, ProductSearchControllerTests, HealthControllerTests, ListEnhancementsTests
    - _Requirements: 17.5_
  - [ ] 16.2 Run `ng test --watch=false` from `frontend/` — ALL existing unit tests must pass
    - _Requirements: 17.6_
  - [ ] 16.3 Run `npx playwright test` from `frontend/` — ALL existing E2E tests must pass
    - Including: navigation, data-loading, filters, response-time, theme, error-handling, dashboard, list-enhancements, phase2-bugfixes
    - _Requirements: 17.6_
  - [ ] 16.4 Run new tests specifically
    - `dotnet test --filter "AdvancedReport"` — all 13+ new tests pass
    - `dotnet test --filter "SortByQuantityOnHand"` — sort fix tests pass
    - `npx playwright test advanced-report.spec.ts` — new E2E tests pass
    - `npx playwright test inventory-sort-fix.spec.ts` — sort fix E2E test passes
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 17. Checkpoint — All changes verified
  - Confirm all 13 Advanced Report endpoints return correct data
  - Confirm inventory sort by QuantityOnHand works correctly
  - Confirm frontend Advanced Report page loads all cards in parallel
  - Confirm no regressions in existing functionality
  - Ask the user if questions arise

## Notes

### Dependency Graph

```
Wave 0 (parallel):
  Task 1 (DTOs)              ─── no dependencies
  Task 2 (Inventory bugfix)  ─── no dependencies

Wave 1 (parallel within, depends on Task 1):
  Task 3 (Revenue + Rankings)     ─── depends on Task 1
  Task 4 (Customer Analytics)     ─── depends on Task 1
  Task 5 (Sales Trend)            ─── depends on Task 1
  Task 6 (Inventory Reports)      ─── depends on Task 1
  Task 7 (Supplier/Group/Driver)  ─── depends on Task 1

Wave 2 (depends on Wave 1):
  Task 8 (FE Module + Routing)    ─── depends on Tasks 3-7 (needs backend ready)
  Task 9 (FE Models + Service)    ─── depends on Tasks 3-7
  Task 10 (FE Report Card)        ─── no backend dependency
  Task 11 (FE Page Component)     ─── depends on Tasks 8, 9, 10

Wave 3 (depends on Wave 0 + Wave 1):
  Task 12 (BE Integration Tests for AdvancedReport) ─── depends on Tasks 3-7
  Task 13 (BE Integration Tests for Sort Fix)       ─── depends on Task 2

Wave 4 (depends on Wave 2 + Wave 3):
  Task 14 (FE E2E Tests for Advanced Report)  ─── depends on Task 11
  Task 15 (FE E2E Test for Sort Fix)           ─── depends on Task 2

Wave 5 (depends on ALL):
  Task 16 (Regression run)  ─── depends on ALL tasks
  Task 17 (Checkpoint)      ─── depends on Task 16
```

### Parallelism Summary

| Wave | Tasks | Can Run In Parallel |
|------|-------|-------------------|
| 0 | 1, 2 | Yes (independent) |
| 1 | 3, 4, 5, 6, 7 | Yes (all independent, each adds endpoints to same controller file but different methods) |
| 2 | 8, 9, 10, 11 | Partially (10 is independent; 8+9 can parallel; 11 depends on 8+9+10) |
| 3 | 12, 13 | Yes (independent test files) |
| 4 | 14, 15 | Yes (independent test files) |
| 5 | 16, 17 | No (sequential verification) |

### Key Implementation Notes

1. **Inventory Bugfix**: The refactored query uses explicit joins rather than navigation properties to enable sorting on the joined `StockItemHoldings.QuantityOnHand`. The `ApplySort` method's generic type parameter changes from `IQueryable<StockItem>` to an anonymous type or a named projection class.

2. **Advanced Report Queries**: All queries should use EF Core LINQ with server-side evaluation (no `.ToList()` before aggregation). Use `.SumAsync()`, `.CountAsync()`, `.GroupBy()` that translates to SQL GROUP BY.

3. **Frontend Parallel Loading**: Use `forkJoin` or individual subscriptions (not `forkJoin` since we want independent rendering). Individual `subscribe()` calls per endpoint allow each card to render as soon as its data arrives.

4. **Sales Trend Week Calculation**: ISO week number can be calculated using `System.Globalization.ISOWeek.GetWeekOfYear()` in .NET. For EF Core, group by `(Year, DayOfYear / 7)` as an approximation or use raw SQL.

5. **Test Pattern**: Follow the existing `IClassFixture<TestWebApplicationFactory>` pattern. Each test method is independent. Use `JsonDocument.Parse` for response validation (same as existing tests).

6. **No Service Layer**: Consistent with the existing architecture, the controller directly uses `WideWorldImportersContext` without an intermediate service layer for backend queries. The frontend uses a dedicated `AdvancedReportService` for HTTP calls.
