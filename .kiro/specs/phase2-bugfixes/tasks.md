# Implementation Plan

## Overview

Fix 11 bugs across backend and frontend in the WideWorldImporters demo app. Backend fixes add missing DTO fields, export support, and remove dead code. Frontend fixes correct field mappings, add detail pages, improve dropdown UX, and remove the unused Sales Report module. Integration verification and property-based tests confirm all fixes.

## Tasks

### Wave 0: Independent Backend Fixes (parallel)

- [x] 1. Backend: Add `export` query param to list controllers for CSV export
  - [x] 1.1 Add `[FromQuery] bool export = false` parameter to each list controller (Orders, Invoices, Customers, Suppliers, StockItems, ProductSearch, Deliveries, PurchaseOrders)
    - When `export == true`: skip pageSize cap, skip `.Skip().Take()`, return all matching data
    - Preserve existing pagination behavior when `export == false`
    - _Bug_Condition: isBugCondition(input) where input.action == "exportCsv" AND totalRecords > pageSize_
    - _Expected_Behavior: Export returns ALL records matching filters without pagination cap_
    - _Preservation: Paginated list responses (page/pageSize/totalCount) unchanged_
    - _Requirements: 2.1, 3.1_

- [x] 2. Backend: Add StockItemName and TotalPrice to OrderLineDto
  - [x] 2.1 Add `StockItemName` (string) and `TotalPrice` (decimal) properties to `OrderLineDto` in `OrderDtos.cs`
    - _Requirements: 2.4_
  - [x] 2.2 Update `GetOrder` in `OrdersController.cs` to join StockItems and compute TotalPrice
    - Load StockItems by IDs from order lines, build lookup dictionary
    - Map `StockItemName = stockItems.GetValueOrDefault(ol.StockItemID, "")`
    - Map `TotalPrice = ol.Quantity * ol.UnitPrice`
    - _Preservation: Other OrderDetail fields (orderDate, customerName, expectedDelivery, quantity, unitPrice) unchanged_
    - _Requirements: 2.4, 3.4_

- [x] 3. Backend: Add StockItemName to InvoiceLineDto (covers Bugs 10 + 11)
  - [x] 3.1 Add `StockItemName` (string) property to `InvoiceLineDto` in `InvoiceDtos.cs`
    - _Requirements: 2.10, 2.11_
  - [x] 3.2 Update `GetInvoice` in `InvoicesController.cs` to join StockItems and map StockItemName
    - _Preservation: Other InvoiceLineDto fields (description, quantity, unitPrice, extendedPrice) unchanged_
    - _Requirements: 2.10, 3.10_
  - [x] 3.3 Update `GetDelivery` in `DeliveryController.cs` to join StockItems and map StockItemName
    - _Preservation: Other delivery line fields unchanged_
    - _Requirements: 2.11, 3.11_

- [x] 4. Backend: Delete SalesReportController and SalesReportDtos
  - [x] 4.1 Delete `backend/WideWorldImporters.Api/Controllers/SalesReportController.cs`
    - _Requirements: 2.6_
  - [x] 4.2 Delete `backend/WideWorldImporters.Api/Models/Dtos/SalesReportDtos.cs`
    - _Requirements: 2.6_

### Wave 1: Independent Frontend Fixes (parallel)

- [x] 5. Frontend: Fix CSV export — pass `export=true` instead of `pageSize: 10000`
  - [x] 5.1 Update `exportFn` in every list component that has one (product-search, inventory, orders, invoices, customers, suppliers, deliveries, purchase-orders)
    - Replace `pageSize: 10000` (or similar) with `export: 'true'` query param
    - _Bug_Condition: exportFn fetches with capped pageSize_
    - _Expected_Behavior: exportFn passes export=true, backend returns all records_
    - _Preservation: Normal paginated list display unchanged_
    - _Requirements: 2.1, 3.1_

- [x] 6. Frontend: Add search input to dropdown-filter panel
  - [x] 6.1 Add `searchTerm` property and `filteredOptions` getter to `dropdown-filter.component.ts`
    - Filter options by case-insensitive substring match on `name`
    - _Requirements: 2.2_
  - [x] 6.2 Add `<input>` above options list in template, bind to `searchTerm`, iterate `filteredOptions`
    - _Preservation: Selection/deselection behavior and emitted IDs unchanged_
    - _Requirements: 2.2, 3.2_
  - [x] 6.3 Style the search input in SCSS to match dark theme
    - _Requirements: 2.2_

- [x] 7. Frontend: Add tooltip to dropdown option text
  - [x] 7.1 Add `[title]="option.name"` to the option-text span in `dropdown-filter.component.html`
    - One-line change
    - _Preservation: Short names display normally without tooltip interference_
    - _Requirements: 2.3, 3.3_

- [x] 8. Frontend: Fix Customer Detail transactions field mapping
  - [x] 8.1 Update `CustomerDetail` interface and template bindings from `transactions` to `recentTransactions`
    - In `customer-detail.component.ts`
    - _Preservation: Recent Orders section display unchanged_
    - _Requirements: 2.7, 3.7_

- [x] 9. Frontend: Fix Supplier Detail purchaseOrders field mapping
  - [x] 9.1 Update `SupplierDetail` interface and template bindings from `purchaseOrders` to `recentPurchaseOrders`
    - In `supplier-detail.component.ts`
    - _Preservation: Stock Items section display unchanged_
    - _Requirements: 2.8, 3.8_

- [x] 10. Frontend: Rename "Product Search" to "Products" + add detail page
  - [x] 10.1 Change page title in `product-search.component.html` from "Product Search" to "Products"
    - _Requirements: 2.5_
  - [x] 10.2 Update nav/sidebar label from "Product Search" to "Products"
    - _Requirements: 2.5_
  - [x] 10.3 Create `ProductDetailComponent` (inline template, same pattern as other details)
    - _Requirements: 2.5_
  - [x] 10.4 Add `:id` child route in product-search module routing and `onRowClick` navigation
    - _Preservation: Products list filtering, sorting, pagination identical to current behavior_
    - _Requirements: 2.5, 3.5_

- [x] 11. Frontend: Inventory detail page — separate route
  - [x] 11.1 Create `InventoryDetailComponent` (inline template, back button, detail fields, response time badge)
    - Same pattern as `OrderDetailComponent`
    - _Requirements: 2.9_
  - [x] 11.2 Add `:id` child route in inventory module routing
    - _Requirements: 2.9_
  - [x] 11.3 Update `onRowClick` to navigate via Router instead of inline panel
    - Remove `selectedStockItem`, `detailLoading`, `loadStockItemDetail()`, `closeDetail()`
    - _Requirements: 2.9_
  - [x] 11.4 Remove inline detail panel HTML from `inventory.component.html`
    - _Preservation: Inventory list page filters, sorting, pagination, export unchanged_
    - _Requirements: 2.9, 3.9_

- [x] 12. Frontend: Remove Sales Report module, route, and nav link
  - [x] 12.1 Delete `frontend/src/app/pages/sales-report/` directory (entire module)
    - _Requirements: 2.6_
  - [x] 12.2 Remove `sales-report` lazy-loaded route from app routing module
    - _Requirements: 2.6_
  - [x] 12.3 Remove "Sales Report" entry from sidebar/nav component
    - _Preservation: All other navigation links and pages unchanged_
    - _Requirements: 2.6, 3.6_

### Wave 2: Integration Verification (depends on Wave 0 + Wave 1)

- [x] 13. Integration: Verify frontend export works end-to-end with backend `export=true`
  - [x] 13.1 Manually test (or write a quick script) that `exportFn` with `export=true` returns all filtered records from backend
    - _Requirements: 2.1_

- [x] 14. Integration: Verify Order/Invoice/Delivery detail pages show product names
  - [x] 14.1 Confirm Order Detail renders `stockItemName` and `totalPrice` columns from backend response
    - _Requirements: 2.4_
  - [x] 14.2 Confirm Invoice Detail renders `stockItemName` column
    - _Requirements: 2.10_
  - [x] 14.3 Confirm Delivery Detail renders `stockItemName` column
    - _Requirements: 2.11_

### Wave 3: Testing

- [x] 15. Write bug condition exploration tests (backend)
  - **Property 1: Bug Condition** - Detail Page Data Completeness
  - **IMPORTANT**: Write these tests BEFORE implementing fixes if doing TDD; otherwise verify against fixed code
  - **GOAL**: Confirm the bugs existed and are now fixed
  - [x] 15.1 Test: `GET /api/orders/{id}` returns non-null `stockItemName` and correct `totalPrice` on each line
    - _Requirements: 2.4_
  - [x] 15.2 Test: `GET /api/invoices/{id}` returns non-null `stockItemName` on each line
    - _Requirements: 2.10_
  - [x] 15.3 Test: `GET /api/delivery/{id}` returns non-null `stockItemName` on each line
    - _Requirements: 2.11_
  - [x] 15.4 Test: List endpoints with `export=true` return all records (totalCount matches data.length)
    - _Requirements: 2.1_
  - [x] 15.5 Test: `GET /api/customers/{id}` response contains `recentTransactions` array field
    - _Requirements: 2.7_
  - [x] 15.6 Test: `GET /api/suppliers/{id}` response contains `recentPurchaseOrders` array field
    - _Requirements: 2.8_

- [x] 16. Write preservation tests (backend)
  - **Property 2: Preservation** - Unchanged API Behavior
  - **IMPORTANT**: These verify non-buggy paths are unaffected
  - [x] 16.1 Test: Paginated list requests (export=false) still return correct page/pageSize/totalCount
    - _Requirements: 3.1_
  - [x] 16.2 Test: Order Detail non-line fields (orderDate, customerName, expectedDelivery) remain correct
    - _Requirements: 3.4_
  - [x] 16.3 Test: Invoice/Delivery Detail non-product fields (description, quantity, unitPrice, extendedPrice) remain correct
    - _Requirements: 3.10, 3.11_
  - [x] 16.4 Test: Customer Detail recentOrders section still returns data
    - _Requirements: 3.7_
  - [x] 16.5 Test: Supplier Detail stockItems section still returns data
    - _Requirements: 3.8_

- [x] 17. Write frontend E2E tests (Playwright)
  - [x] 17.1 Test: CSV export downloads file with row count matching total filtered records
    - _Requirements: 2.1_
  - [x] 17.2 Test: Dropdown filter search input filters options in real time
    - _Requirements: 2.2_
  - [x] 17.3 Test: Long option names show tooltip on hover (title attribute present)
    - _Requirements: 2.3_
  - [x] 17.4 Test: Customer Detail shows transactions when data exists
    - _Requirements: 2.7_
  - [x] 17.5 Test: Supplier Detail shows purchase orders when data exists
    - _Requirements: 2.8_
  - [x] 17.6 Test: Inventory row click navigates to `/inventory/:id` detail page
    - _Requirements: 2.9_
  - [x] 17.7 Test: Products row click navigates to `/products/:id` detail page
    - _Requirements: 2.5_
  - [x] 17.8 Test: Sales Report nav link and route no longer exist
    - _Requirements: 2.6_
  - [x] 17.9 Test: Order/Invoice/Delivery detail pages show product names in line items
    - _Requirements: 2.4, 2.10, 2.11_

### Wave 4: Final Checkpoint

- [x] 18. Checkpoint — Ensure all tests pass
  - Run `dotnet test` for backend integration tests
  - Run `ng test --watch=false` for frontend unit tests
  - Run `npx playwright test` for E2E tests
  - Ensure no regressions across all 11 fixes
  - Ask the user if questions arise
  - _Requirements: 3.12_

## Notes

### Dependency Graph

```
Wave 0 (all parallel, no dependencies):
  Task 1 (export param)     ─┐
  Task 2 (OrderLine DTO)    ─┤
  Task 3 (InvoiceLine DTO)  ─┼── Backend fixes, independent of each other
  Task 4 (delete Sales BE)  ─┘

Wave 1 (all parallel, no dependencies on each other):
  Task 5 (export FE)        ─── depends on Task 1
  Task 6 (dropdown search)  ─┐
  Task 7 (dropdown tooltip) ─┤
  Task 8 (customer field)   ─┼── Independent frontend fixes, no backend dependency
  Task 9 (supplier field)   ─┤
  Task 10 (products rename) ─┤
  Task 11 (inventory detail)─┤
  Task 12 (delete Sales FE) ─┘── depends on Task 4 (backend gone first)

Wave 2 (integration verification):
  Task 13 ─── depends on Tasks 1 + 5
  Task 14 ─── depends on Tasks 2 + 3

Wave 3 (testing):
  Task 15 (bug condition tests)  ─── depends on Wave 0
  Task 16 (preservation tests)   ─── depends on Wave 0
  Task 17 (E2E tests)            ─── depends on Wave 0 + Wave 1

Wave 4 (checkpoint):
  Task 18 ─── depends on ALL previous tasks
```

### Parallelism Summary

| Wave | Tasks | Can Run In Parallel |
|------|-------|-------------------|
| 0 | 1, 2, 3, 4 | Yes (all independent backend) |
| 1 | 5, 6, 7, 8, 9, 10, 11, 12 | Yes (all independent frontend, except 5→1 and 12→4) |
| 2 | 13, 14 | Yes (both independent) |
| 3 | 15, 16, 17 | Yes (all independent test suites) |
| 4 | 18 | No (final gate) |


### Wave 5: New Bug Fixes (Bugs 12–14)

- [x] 19. Frontend: Fix Dashboard chart nativeElement crash (Bug 12)
  - [x] 19.1 Guard `buildChart` with null-check on `this.chartCanvas` + defer calls with `setTimeout(..., 0)` in both `loadDashboardData` and `ngAfterViewInit`
    - In `buildChart`: add early return `if (!this.chartCanvas) return;`
    - In `loadDashboardData` next callback: replace `this.buildChart(data)` with `setTimeout(() => this.buildChart(data), 0)`
    - In `ngAfterViewInit`: wrap `this.buildChart(this.pendingChartData!)` in `setTimeout`
    - _Bug_Condition: kpiData arrives after ngAfterViewInit, canvas is inside *ngIf="kpiData" so ViewChild is undefined until next CD cycle_
    - _Expected_Behavior: Chart renders without TypeError after data loads_
    - _Preservation: Chart still displays correctly once data and canvas are both available_
    - _Requirements: Bug 12_
  - [x] 19.2 Test: Unit test that `buildChart` is not called when `chartCanvas` is undefined
    - Mock scenario where `chartCanvas` is undefined, verify no exception thrown
    - _Requirements: Bug 12_
  - [x] 19.3 Test: E2E test — Dashboard chart renders without console errors (Playwright)
    - Navigate to dashboard, wait for KPI data, assert canvas element exists and no console errors
    - _Requirements: Bug 12_

- [x] 20. Frontend + Backend: Fix silent export failure for large datasets (Bug 13)
  - [x] 20.1 Frontend: Show user-visible error message in `ExportCsvButtonComponent` on failure
    - Add `errorMessage` property, update template to display it, set it in `error` callback
    - _Bug_Condition: fetchFn fails (timeout, 4xx, 5xx) and user sees no feedback_
    - _Expected_Behavior: Error message is displayed to user on export failure_
    - _Preservation: Successful exports still work as before_
    - _Requirements: Bug 13, Property 7_
  - [x] 20.2 Frontend: Add `@Input() totalCount` and confirmation warning when `totalCount > 10000` before export
    - Use `confirm()` dialog; if user cancels, abort export
    - Update all parent components that use `<app-export-csv-button>` to pass `[totalCount]="totalCount"`
    - _Requirements: Bug 13_
  - [x] 20.3 Backend: Add export row limit cap (50,000) with 413 response in all list controllers that support `export=true`
    - Before executing export query: count rows, if > 50000 return `StatusCode(413, ...)` with explanatory JSON
    - Applies to: Orders, Invoices, Customers, Suppliers, StockItems, ProductSearch, Deliveries, PurchaseOrders
    - _Bug_Condition: totalRecords > 50000 AND export=true → query times out or OOMs_
    - _Expected_Behavior: 413 returned with clear error message_
    - _Preservation: Exports ≤ 50k rows still return full data_
    - _Requirements: Bug 13, Bug 14, Property 8_
  - [x] 20.4 Backend: Increase EF Core `CommandTimeout` to 120s for export queries in all list controllers
    - Add `_context.Database.SetCommandTimeout(120)` before export `.ToListAsync()`
    - _Requirements: Bug 13_
  - [x] 20.5 Test: Backend integration test — export endpoint with >50k matching rows returns 413
    - _Requirements: Bug 13, Property 8_
  - [x] 20.6 Test: E2E test — export failure shows error message in UI (not silent)
    - Mock or trigger a failed export, assert error message element is visible
    - _Requirements: Bug 13, Property 7_

- [x] 21. Verify export fix applies to all list pages (Bug 14)
  - [x] 21.1 Verify `ExportCsvButtonComponent` fix (error message + totalCount warning) is inherited by all pages: Orders, Invoices, Deliveries, Customers, Suppliers, Inventory, ProductSearch, PurchaseOrders, Warehouse, Payments
    - Ensure all parent components pass `[totalCount]` to the shared component
    - _Bug_Condition: Any list page export could fail silently_
    - _Expected_Behavior: All pages show error on failure and warn on large exports_
    - _Requirements: Bug 14_
  - [x] 21.2 Test: Backend integration test — all list export endpoints respect the 50k row limit cap
    - Parameterized test across all controllers with export support
    - _Requirements: Bug 14, Property 8_

- [x] 22. Checkpoint — Ensure all new bug fix tests pass
  - Run `dotnet test` for backend integration tests (including new 413 tests)
  - Run `ng test --watch=false` for frontend unit tests (including dashboard chart test)
  - Run `npx playwright test` for E2E tests (including dashboard + export error tests)
  - Ensure no regressions in Waves 0–4
  - Ask the user if questions arise
  - _Requirements: Bug 12, Bug 13, Bug 14_

## Wave 5 Dependency Graph

```
Wave 5 (new bugs):
  Task 19 (dashboard chart) ─── independent, no deps on other Wave 5 tasks
  Task 20.1 + 20.2 (frontend export error) ─── independent
  Task 20.3 + 20.4 (backend export cap) ─── independent
  Task 21 ─── depends on Tasks 20.1 + 20.2 + 20.3
  Task 22 ─── depends on ALL Wave 5 tasks
```

| Wave | Tasks | Can Run In Parallel |
|------|-------|-------------------|
| 5a | 19.1, 20.1, 20.2, 20.3, 20.4 | Yes (all independent) |
| 5b | 19.2, 19.3, 20.5, 20.6, 21.1, 21.2 | Yes (tests + verification, after 5a) |
| 5c | 22 | No (final checkpoint) |
