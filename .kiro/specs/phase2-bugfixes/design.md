# Phase 2 Bugfixes Design

## Overview

This document specifies the technical approach for fixing 11 bugs found during Phase 2 list page enhancements. The bugs span: CSV export truncation, dropdown UX, detail page data mapping mismatches (Customer, Supplier), missing backend joins (Order, Invoice, Delivery), page renaming (Product Search → Products), dead feature removal (Sales Report), and inconsistent detail navigation (Inventory).

## Glossary

- **Bug_Condition (C)**: The set of conditions under which each bug manifests — specific user actions that trigger incorrect/missing data display
- **Property (P)**: The correct behavior after fix — data appears, navigation works, dead code is gone
- **Preservation**: Existing pagination, filtering, sorting, and unaffected detail fields must remain unchanged
- **PaginatedResponse**: Backend DTO wrapper returning `{ data, page, pageSize, totalCount }`
- **exportFn**: Frontend lambda that fetches data for CSV generation
- **InvoiceLineDto**: Shared DTO used by both Invoice and Delivery detail endpoints

## Bug Details

### Bug Condition

The bugs manifest across multiple independent conditions:

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserAction
  OUTPUT: boolean

  RETURN (input.action == "exportCsv" AND totalRecords > pageSize)
         OR (input.action == "openMultiSelectPanel" AND options.length > 10)
         OR (input.action == "hoverLongOption" AND option.name.length > panelWidth)
         OR (input.action == "viewOrderDetail" AND orderLines.any())
         OR (input.action == "navigateProductSearch")
         OR (input.action == "navigateSalesReport")
         OR (input.action == "viewCustomerDetail" AND customer.hasTransactions)
         OR (input.action == "viewSupplierDetail" AND supplier.hasPurchaseOrders)
         OR (input.action == "clickInventoryRow")
         OR (input.action == "viewInvoiceDetail" AND invoiceLines.any())
         OR (input.action == "viewDeliveryDetail" AND deliveryLines.any())
END FUNCTION
```

### Examples

- Export CSV on Orders page with 500 filtered results → only 100 rows exported (pageSize cap)
- Open Supplier multi-select with 40+ options → no way to search, must scroll
- Hover "Northwind Traders International Wholesale" in dropdown → truncated, no tooltip
- Order Detail line shows blank Product column → backend `OrderLineDto` lacks `StockItemName`
- Customer Detail Transactions section says "No transactions" → frontend reads `transactions`, backend sends `recentTransactions`
- Supplier Detail PO section says "No purchase orders" → frontend reads `purchaseOrders`, backend sends `recentPurchaseOrders`
- Click inventory row → inline panel appears below table, not a detail route
- Invoice/Delivery Detail Product column blank → `InvoiceLineDto` lacks `StockItemName`

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All list page pagination (page/pageSize/totalCount) must continue working
- Multi-select dropdown selection/deselection must continue emitting correct IDs
- Short dropdown option names display without tooltip interference
- Order Detail fields (dates, customer, quantity, unitPrice) remain correct
- Products list filtering, sorting, pagination identical to current Product Search
- All other pages (Dashboard, Orders, Customers, etc.) unaffected by Sales Report removal
- Customer Detail Recent Orders section remains correct
- Supplier Detail Stock Items section remains correct
- Inventory list page filters, sorting, pagination, export remain correct
- Invoice/Delivery detail fields (description, quantity, unitPrice, extendedPrice) remain correct

**Scope:**
All inputs that do NOT involve the 11 specific bug conditions should be completely unaffected.

## Hypothesized Root Cause

1. **CSV Export (Bug 1.1)**: `exportFn` uses `pageSize: 10000` which is capped by backend to `100`. The export only gets one page of capped results.
2. **Dropdown Search (Bug 1.2)**: `dropdown-filter.component.html` multi-select panel has no `<input>` for filtering — never implemented.
3. **Dropdown Tooltip (Bug 1.3)**: `__option-text` span uses `text-overflow: ellipsis` but no `title` attribute.
4. **Order Detail Product/Total (Bug 1.4)**: `OrderLineDto` has no `StockItemName` or `TotalPrice` property. Controller maps `OrderLines` without joining `StockItems`.
5. **Product Search Rename (Bug 1.5)**: Route, module, nav all say "Product Search". No detail route exists.
6. **Sales Report (Bug 1.6)**: Entire feature module exists but is duplicate/unused.
7. **Customer Transactions (Bug 1.7)**: Backend `CustomerDetailDto` has `RecentTransactions` (camelCase: `recentTransactions`). Frontend interface binds `transactions`. Mismatch.
8. **Supplier POs (Bug 1.8)**: Backend `SupplierDetailDto` has `RecentPurchaseOrders` (camelCase: `recentPurchaseOrders`). Frontend interface binds `purchaseOrders`. Mismatch.
9. **Inventory Detail (Bug 1.9)**: `onRowClick` calls `loadStockItemDetail` which sets `selectedStockItem` shown inline. No route navigation.
10. **Invoice Detail Product (Bug 1.10)**: `InvoiceLineDto` has no `StockItemName`. Controller maps without `StockItems` join.
11. **Delivery Detail Product (Bug 1.11)**: Same `InvoiceLineDto` issue — reuses the DTO from Bug 1.10.

## Correctness Properties

Property 1: Bug Condition - Data Completeness on Detail Pages

_For any_ detail page request (Order, Invoice, Delivery) where line items reference a StockItem, the fixed endpoint SHALL return `stockItemName` populated from the StockItems table join, and for Order lines SHALL also return `totalPrice` computed as `quantity * unitPrice`.

**Validates: Requirements 2.4, 2.10, 2.11**

Property 2: Bug Condition - Field Name Mapping Consistency

_For any_ Customer Detail or Supplier Detail API response, the frontend component SHALL correctly bind to the actual JSON field names (`recentTransactions`, `recentPurchaseOrders`) so that data is displayed when present.

**Validates: Requirements 2.7, 2.8**

Property 3: Bug Condition - CSV Export Completeness

_For any_ CSV export action, the export function SHALL fetch ALL records matching current filters without being constrained by the list page's pagination pageSize cap.

**Validates: Requirements 2.1**

Property 4: Bug Condition - Dropdown Usability

_For any_ multi-select dropdown panel with options, the panel SHALL include a search input for real-time filtering, and each option SHALL expose its full text via a title tooltip.

**Validates: Requirements 2.2, 2.3**

Property 5: Bug Condition - Navigation Consistency

_For any_ list page row click (Inventory, Products), the system SHALL navigate to a dedicated `/:id` detail route, consistent with all other list pages.

**Validates: Requirements 2.5, 2.9**

Property 6: Preservation - Unaffected Functionality

_For any_ input that does NOT involve the 11 bug conditions, the fixed system SHALL produce identical behavior to the original system, including pagination, filtering, sorting, and all other detail page fields.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11**

## Fix Implementation

### Changes Required

---

### Bug 1: CSV Export — Remove pageSize limit

**File**: `frontend/src/app/pages/product-search/product-search.component.ts`
**File**: `frontend/src/app/pages/inventory/inventory.component.ts`
(and any other page with `exportFn`)

**Change**: In each `exportFn`, remove `pageSize: 10000` and instead pass `pageSize: 0` (or a sentinel value). Backend needs a corresponding change to interpret `pageSize=0` as "return all" for export purposes, OR frontend iterates pages. Simplest approach: add a dedicated `/api/{resource}/export` endpoint that skips pagination, OR allow backend `pageSize` up to a high limit (e.g., 100000) when explicitly requested for export.

**Recommended approach** (minimal diff): Backend controllers already cap `pageSize` at 100. Add an `export=true` query param that lifts the cap and removes pagination. Frontend `exportFn` passes `export: true` instead of `pageSize: 10000`.

**Backend changes** (per list controller that supports export — Orders, Invoices, Customers, Suppliers, StockItems, ProductSearch, Deliveries, PurchaseOrders):
- Add `[FromQuery] bool export = false` parameter
- When `export == true`: skip the pageSize cap, skip `.Skip().Take()`, return all matching data directly

**Frontend changes**:
- Each `exportFn` lambda: replace `pageSize: 10000` with `export: 'true'`

---

### Bug 2: Dropdown filter search input

**File**: `frontend/src/app/shared/components/dropdown-filter/dropdown-filter.component.ts`
**File**: `frontend/src/app/shared/components/dropdown-filter/dropdown-filter.component.html`
**File**: `frontend/src/app/shared/components/dropdown-filter/dropdown-filter.component.scss`

**Change**:
- Add a `searchTerm` property to the component
- Add a computed getter `filteredOptions` that filters `options` by `searchTerm` (case-insensitive substring match on `name`)
- In HTML: add `<input>` above the options list inside `__panel`, bound to `searchTerm`
- In HTML: iterate `filteredOptions` instead of `options` in the `*ngFor`
- In SCSS: style the search input to match the dark theme

---

### Bug 3: Dropdown option tooltip

**File**: `frontend/src/app/shared/components/dropdown-filter/dropdown-filter.component.html`

**Change**: Add `[title]="option.name"` to the `<span class="dropdown-filter__option-text">` element.

One-liner.

---

### Bug 4: Order Detail — add StockItemName and TotalPrice

**File**: `backend/WideWorldImporters.Api/Models/Dtos/OrderDtos.cs`

**Change**: Add to `OrderLineDto`:
```csharp
public string StockItemName { get; set; }
public decimal TotalPrice { get; set; }
```

**File**: `backend/WideWorldImporters.Api/Controllers/OrdersController.cs`

**Change**: In `GetOrder` method, after loading order with `.Include(o => o.OrderLines)`, also load StockItems. Simplest: use a lookup dictionary or join.
```csharp
var stockItemIds = order.OrderLines.Select(ol => ol.StockItemID).Distinct().ToList();
var stockItems = await _context.StockItems
    .Where(si => stockItemIds.Contains(si.StockItemID))
    .ToDictionaryAsync(si => si.StockItemID, si => si.StockItemName);
```
Then in the `.Select` mapping:
```csharp
StockItemName = stockItems.GetValueOrDefault(ol.StockItemID, ""),
TotalPrice = ol.Quantity * ol.UnitPrice
```

**Frontend**: Already expects `stockItemName` and `totalPrice` — no frontend change needed (interface already declares these fields).

---

### Bug 5: Product Search → Products rename + detail page

**Frontend files to change**:
- `frontend/src/app/pages/product-search/product-search.component.html` — change page title from "Product Search" to "Products"
- `frontend/src/app/pages/product-search/product-search.module.ts` — add detail route and component
- `frontend/src/app/pages/product-search/` — add `product-detail.component.ts`
- App routing module — rename nav label from "Product Search" to "Products"
- Sidebar/nav component — update label

**Change**:
- Add a `ProductDetailComponent` (inline template) similar to other detail components
- Add route `{ path: ':id', component: ProductDetailComponent }` in the product-search module
- Add `onRowClick` handler to navigate to detail route
- Backend: the existing `GET /api/productsearch/{id}` or `GET /api/stockitems/{id}` endpoint already serves detail data

---

### Bug 6: Sales Report removal

**Files to DELETE**:
- `frontend/src/app/pages/sales-report/` (entire directory: 4 files)
- `backend/WideWorldImporters.Api/Controllers/SalesReportController.cs`
- `backend/WideWorldImporters.Api/Models/Dtos/SalesReportDtos.cs`

**Files to EDIT**:
- App routing module — remove `sales-report` lazy-loaded route
- Sidebar/nav component — remove "Sales Report" nav link
- Backend Startup.cs — no change needed (controller auto-discovered)

---

### Bug 7: Customer Detail transactions field mapping

**File**: `frontend/src/app/pages/customers/customer-detail.component.ts`

**Change**: In the `CustomerDetail` interface, rename `transactions` to `recentTransactions`. Update all template bindings from `detail.transactions` to `detail.recentTransactions`.

---

### Bug 8: Supplier Detail POs field mapping

**File**: `frontend/src/app/pages/suppliers/supplier-detail.component.ts`

**Change**: In the `SupplierDetail` interface, rename `purchaseOrders` to `recentPurchaseOrders`. Update all template bindings from `detail.purchaseOrders` to `detail.recentPurchaseOrders`.

---

### Bug 9: Inventory detail page — separate route

**Files to change**:
- `frontend/src/app/pages/inventory/inventory.component.ts` — change `onRowClick` to navigate via Router
- `frontend/src/app/pages/inventory/inventory.component.html` — remove the inline detail panel `<div class="detail-panel" ...>`
- `frontend/src/app/pages/inventory/inventory.module.ts` — add detail route
- `frontend/src/app/pages/inventory/` — add `inventory-detail.component.ts` (new file, inline template pattern)

**Change**:
- Create `InventoryDetailComponent` using same pattern as `OrderDetailComponent` (back button, detail fields, response time badge)
- Move the detail display logic from inline panel to the new component
- Route: `{ path: ':id', component: InventoryDetailComponent }`
- `onRowClick` now does `this.router.navigate([row.stockItemId], { relativeTo: this.route })`
- Remove `selectedStockItem`, `detailLoading`, `loadStockItemDetail()`, `closeDetail()` from inventory.component.ts

---

### Bug 10: Invoice Detail — add StockItemName

**File**: `backend/WideWorldImporters.Api/Models/Dtos/InvoiceDtos.cs`

**Change**: Add to `InvoiceLineDto`:
```csharp
public string StockItemName { get; set; }
```

**File**: `backend/WideWorldImporters.Api/Controllers/InvoicesController.cs`

**Change**: In `GetInvoice`, after loading invoice with `.Include(i => i.InvoiceLines)`, load StockItems:
```csharp
var stockItemIds = invoice.InvoiceLines.Select(il => il.StockItemID).Distinct().ToList();
var stockItems = await _context.StockItems
    .Where(si => stockItemIds.Contains(si.StockItemID))
    .ToDictionaryAsync(si => si.StockItemID, si => si.StockItemName);
```
Map in the DTO:
```csharp
StockItemName = stockItems.GetValueOrDefault(il.StockItemID, "")
```

**Frontend**: Already expects `line.stockItemName` in template — no change needed.

---

### Bug 11: Delivery Detail — add StockItemName

**File**: `backend/WideWorldImporters.Api/Controllers/DeliveryController.cs`

**Change**: Same pattern as Bug 10. In `GetDelivery`, after loading invoice with InvoiceLines, load StockItems and map `StockItemName` into `InvoiceLineDto`.

**Frontend**: Already expects `line.stockItemName` in template — no change needed.

Since Bugs 10 and 11 both use `InvoiceLineDto`, the DTO change from Bug 10 covers both.

---

## Testing Strategy

### Validation Approach

Each bug fix requires both a "fix check" (verify the bug is fixed) and a "preservation check" (verify nothing else broke). Given the project setup, backend fixes get integration tests (xUnit), frontend fixes get E2E tests (Playwright).

### Exploratory Bug Condition Checking

**Goal**: Confirm each bug exists on unfixed code.

**Test Cases**:
1. **CSV Export**: Call list API with `page=1&pageSize=10000` → observe backend caps at 100
2. **Order Detail**: Call `GET /api/orders/1` → observe `lines[].stockItemName` is null/missing
3. **Customer Detail**: Call `GET /api/customers/1` → observe response has `recentTransactions` not `transactions`
4. **Supplier Detail**: Call `GET /api/suppliers/1` → observe response has `recentPurchaseOrders` not `purchaseOrders`
5. **Invoice Detail**: Call `GET /api/invoices/1` → observe `lines[].stockItemName` is null/missing
6. **Delivery Detail**: Call `GET /api/delivery/1` → observe `lines[].stockItemName` is null/missing

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed system produces correct behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedSystem(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, behavior is unchanged.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSystem(input) = fixedSystem(input)
END FOR
```

### Unit Tests

**Backend (xUnit integration tests)**:
- `OrdersControllerTests`: Verify `GET /api/orders/{id}` returns `stockItemName` and `totalPrice` on each line
- `InvoicesControllerTests`: Verify `GET /api/invoices/{id}` returns `stockItemName` on each line
- `DeliveryControllerTests`: Verify `GET /api/delivery/{id}` returns `stockItemName` on each line
- `CustomersControllerTests`: Verify `GET /api/customers/{id}` response shape includes `recentTransactions` array
- `SuppliersControllerTests`: Verify `GET /api/suppliers/{id}` response shape includes `recentPurchaseOrders` array
- `ExportTests`: Verify list endpoints with `export=true` return all records without pageSize cap

### Property-Based Tests

- Generate random valid order IDs → verify every `OrderLineDto` has non-null `StockItemName`
- Generate random filter combinations → verify export returns `totalCount` matching items
- Generate random StockItem IDs → verify detail endpoint returns complete data

### Integration Tests

**E2E (Playwright)**:
- CSV export downloads file with correct row count matching total filtered records
- Dropdown filter search input filters options in real time
- Long option names show tooltip on hover
- Customer Detail shows transactions when data exists
- Supplier Detail shows purchase orders when data exists
- Inventory row click navigates to `/inventory/:id` detail page
- Products row click navigates to `/products/:id` detail page
- Sales Report nav link and route no longer exist
- Order/Invoice/Delivery detail pages show product names in line items

---

## Phase 2 — Additional Bugs (Bugs 12–14)

### Bug 12: Dashboard `nativeElement` crash

**File**: `frontend/src/app/pages/dashboard/dashboard.component.ts`

**Root Cause**: `@ViewChild('kpiChart')` references a `<canvas #kpiChart>` that sits inside `*ngIf="kpiData"`. Because `kpiData` is `null` on init, the canvas is not in the DOM — so `this.chartCanvas` is `undefined` at `ngAfterViewInit`. The existing `chartReady` / `pendingChartData` guard sets `chartReady = true` in `ngAfterViewInit` and defers `buildChart` until data arrives, which looks correct. However when data arrives, the code does:

```typescript
this.kpiData = data;         // triggers *ngIf to become truthy
// ...
this.buildChart(data);       // called immediately — Angular CD hasn't run yet
```

Angular's `*ngIf` does not instantly insert the `<canvas>` into the DOM; it waits for the next change-detection cycle. So `this.chartCanvas` is still `undefined` when `buildChart` accesses `.nativeElement`, causing `TypeError: Cannot read properties of undefined (reading 'nativeElement')`.

**Fix**: Guard `buildChart` with a null-check on `this.chartCanvas`, then defer via `setTimeout(() => this.buildChart(data), 0)` after setting `kpiData`. This allows Angular's change-detection cycle to run and insert the canvas before `buildChart` executes. Alternatively, inject `ChangeDetectorRef` and call `this.cdr.detectChanges()` immediately after setting `kpiData` before calling `buildChart`.

The `setTimeout` approach is the minimal diff: no new import, one-line change.

---

### Bug 13: Export silently fails for large datasets (73k+ records)

**Files**:
- `frontend/src/app/shared/components/export-csv-button/export-csv-button.component.ts`
- `backend/WideWorldImporters.Api/Controllers/OrdersController.cs` (and all other list controllers)

**Root Cause (multiple contributing factors)**:

1. **Backend SQL timeout**: EF Core `.ToListAsync()` on 73k+ rows with joins can exceed the default SQL command timeout (30s), causing the query to throw an exception mid-flight. The `ExceptionHandlingMiddleware` returns a 500/408, or the connection is dropped.
2. **Frontend silent failure**: `ExportCsvButtonComponent.export()` error handler does only `this.loading = false` — no error message shown to the user. The button goes back to "Export CSV" with no feedback.
3. **Frontend memory**: `generateCsv()` builds the entire CSV string synchronously in one call. For 73k rows × multiple columns this is a large synchronous string allocation, but with modern V8 it's usually tolerable below ~500k rows. The `Blob` creation at the end is fine.
4. **No user warning**: No indication before the export that a very large download is starting.

**Fix**:

Backend — add a row-count cap for export endpoints:
- When `export=true`, add a hard cap of 50,000 rows
- If `totalCount > 50000`, return HTTP 413 (Payload Too Large) with a JSON body explaining the limit
- Increase EF Core `CommandTimeout` for export queries to 120s to handle the 50k-row case

Frontend — surface errors to the user:
- In `ExportCsvButtonComponent.export()`, the `error` callback must set an `errorMessage` property and display it in the template
- Add a user confirmation dialog (browser `confirm()` or a visible warning banner) when `totalCount > 10000` before starting export
- `@Input() totalCount?: number` added to `ExportCsvButtonComponent` so the parent can pass the current filtered count

---

### Bug 14: Export silent failure affects all list pages

**Root Cause**: Bug 13's frontend fix is in `ExportCsvButtonComponent`, a shared component used by all list pages. The fix automatically covers: Orders, Invoices, Deliveries, Customers, Suppliers, StockItems/Inventory, ProductSearch, PurchaseOrders, Warehouse, Payments.

The backend fix (row cap + timeout) must be applied per-controller. Controllers that already have `export=true` support (added in Wave 0): Orders, Invoices, Customers, Suppliers, StockItems, ProductSearch, Deliveries, PurchaseOrders. Remaining controllers (Warehouse, Payments) need the same treatment if they have list+export endpoints.

---

## Additional Correctness Properties

### Property 7: Export error is always surfaced to the user

_For any_ failed export attempt (network error, timeout, 4xx/5xx response), the `ExportCsvButtonComponent` SHALL display a visible error message to the user and reset to an actionable state — it SHALL NOT silently return to the idle state without feedback.

**Validates: Bug 13 (frontend error handler)**

### Property 8: Export row cap is enforced consistently

_For any_ list endpoint that supports `export=true`, when the total matching record count exceeds 50,000 the backend SHALL return HTTP 413 with an explanatory error message rather than attempting to stream the full dataset.

**Validates: Bug 13 and Bug 14 (backend cap)**

---

## Additional Fix Implementation

### Bug 12: Dashboard chart timing fix

**File**: `frontend/src/app/pages/dashboard/dashboard.component.ts`

**Change**: In `loadDashboardData` `next` callback, after setting `this.kpiData = data`, replace the direct `this.buildChart(data)` call with a deferred call:

```typescript
this.kpiData = data;
// ...
if (this.chartReady) {
  setTimeout(() => this.buildChart(data), 0);  // defer until CD inserts <canvas>
} else {
  this.pendingChartData = data;
}
```

Also add a null-guard in `buildChart` itself as a safety net:

```typescript
private buildChart(data: DashboardKpi): void {
  if (!this.chartCanvas) return;  // canvas not yet in DOM
  // ... rest of method unchanged
}
```

And in `ngAfterViewInit`:

```typescript
ngAfterViewInit(): void {
  this.chartReady = true;
  if (this.pendingChartData) {
    setTimeout(() => {
      this.buildChart(this.pendingChartData!);
      this.pendingChartData = null;
    }, 0);
  }
}
```

---

### Bug 13 & 14: Export error surfacing + backend row cap

**Frontend** (`export-csv-button.component.ts`):

Add `@Input() totalCount?: number` and `errorMessage: string | null = null`. Update template to show error. Update `export()` to warn on large counts and surface errors:

```typescript
export(): void {
  if (!this.fetchFn || this.loading) return;
  if (this.totalCount && this.totalCount > 10000) {
    const ok = confirm(`This will export ${this.totalCount.toLocaleString()} records. Continue?`);
    if (!ok) return;
  }
  this.loading = true;
  this.errorMessage = null;
  this.fetchFn().subscribe({
    next: (data) => { /* existing logic */ this.loading = false; },
    error: () => {
      this.loading = false;
      this.errorMessage = 'Export failed. The dataset may be too large or the server timed out.';
    }
  });
}
```

**Backend** (each list controller with `export=true`):

Add row cap check before executing the export query:

```csharp
if (export) {
  const int ExportRowLimit = 50_000;
  var count = await query.CountAsync();
  if (count > ExportRowLimit)
    return StatusCode(413, new { error = $"Export exceeds {ExportRowLimit:N0} row limit. Apply filters to reduce the result set." });
  // Increase command timeout for large queries
  _context.Database.SetCommandTimeout(120);
  var data = await query.ToListAsync();
  return Ok(data);
}
```
