# Bugfix Requirements Document

## Introduction

This document captures 11 bugs found during Phase 2 list page enhancements of the WideWorldImporters demo application. The bugs span CSV export behavior, dropdown filter UX, detail page data mapping issues, page naming/routing, and dead feature removal. Each fix must include regression tests.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user clicks "Export CSV" on any list page THEN the system only exports the current page of data (up to pageSize, hardcoded at 10000 max) instead of all filtered results

1.2 WHEN the multi-select dropdown filter panel is open and there are many options THEN the system provides no search/filter input inside the panel, forcing users to scroll through all options

1.3 WHEN a multi-select dropdown option has a long name THEN the system truncates the text with CSS ellipsis and provides no way to read the full text

1.4 WHEN viewing the Order Detail page THEN the Product (stockItemName) and Total (totalPrice) columns in the order lines table display blank because the backend `OrderLineDto` does not include `StockItemName` or a computed total field

1.5 WHEN navigating to the "Product Search" page THEN the system displays "Product Search" in the navigation and page title, and clicking a product row does not navigate to a detail page

1.6 WHEN the Sales Report page exists in the application THEN it duplicates functionality already covered by the Orders page, creating user confusion

1.7 WHEN viewing the Customer Detail page THEN the Transactions section always shows "No transactions" because the frontend binds to `detail.transactions` but the backend returns the field as `recentTransactions`

1.8 WHEN viewing the Supplier Detail page THEN the Purchase Orders section always shows "No purchase orders" because the frontend binds to `detail.purchaseOrders` but the backend returns the field as `recentPurchaseOrders`

1.9 WHEN clicking a row on the Inventory/StockItems list page THEN the system shows the detail inline at the bottom of the page instead of navigating to a separate detail route like other list pages

1.10 WHEN viewing the Invoice Detail page THEN the Product column in the line items table displays blank because the backend `InvoiceLineDto` does not include `StockItemName`

1.11 WHEN viewing the Delivery Detail page THEN the Product column in the line items table displays blank because the backend reuses `InvoiceLineDto` which does not include `StockItemName`

### Expected Behavior (Correct)

2.1 WHEN the user clicks "Export CSV" on any list page THEN the system SHALL export ALL records matching the current filters by fetching without page-size limit (or iterating all pages), regardless of how many are displayed on screen

2.2 WHEN the multi-select dropdown filter panel is open THEN the system SHALL display a search input at the top of the panel that filters the visible options by text match in real time

2.3 WHEN a multi-select dropdown option has a long name THEN the system SHALL show the full text on hover via a tooltip (title attribute or equivalent)

2.4 WHEN viewing the Order Detail page THEN the system SHALL display the product name (from StockItems table) and computed total (quantity * unitPrice) for each order line

2.5 WHEN navigating to the products list page THEN the system SHALL display "Products" in the navigation and page title, and clicking a product row SHALL navigate to a `/products/:id` detail page showing full product information

2.6 WHEN the Sales Report page is removed THEN the system SHALL have no navigation link, route, frontend module, or backend controller for Sales Report

2.7 WHEN viewing the Customer Detail page for a customer that has transactions THEN the system SHALL display the customer's recent transactions by correctly mapping the `recentTransactions` response field

2.8 WHEN viewing the Supplier Detail page for a supplier that has purchase orders THEN the system SHALL display the supplier's recent purchase orders by correctly mapping the `recentPurchaseOrders` response field

2.9 WHEN clicking a row on the Inventory/StockItems list page THEN the system SHALL navigate to a separate `/inventory/:id` detail route and render a dedicated detail component (consistent with other list pages)

2.10 WHEN viewing the Invoice Detail page THEN the system SHALL display the product name (from StockItems join) for each invoice line

2.11 WHEN viewing the Delivery Detail page THEN the system SHALL display the product name (from StockItems join) for each delivery line

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user applies filters on a list page and views paginated results THEN the system SHALL CONTINUE TO display paginated results correctly with proper page/pageSize/totalCount

3.2 WHEN the user selects/deselects options in the multi-select dropdown THEN the system SHALL CONTINUE TO emit the selected IDs and filter the list correctly

3.3 WHEN a dropdown option has a short name that fits within the panel width THEN the system SHALL CONTINUE TO display it normally without any tooltip interference

3.4 WHEN viewing Order Detail fields other than Product/Total (orderDate, customerName, expectedDelivery, quantity, unitPrice) THEN the system SHALL CONTINUE TO display them correctly

3.5 WHEN using the Products list page with filters, sorting, and pagination THEN the system SHALL CONTINUE TO function identically to the current Product Search behavior

3.6 WHEN navigating to all other pages (Orders, Customers, Invoices, etc.) THEN the system SHALL CONTINUE TO function normally after Sales Report removal

3.7 WHEN viewing the Customer Detail page Recent Orders section THEN the system SHALL CONTINUE TO display orders correctly

3.8 WHEN viewing the Supplier Detail page Stock Items section THEN the system SHALL CONTINUE TO display stock items correctly

3.9 WHEN using the Inventory list page with filters, sorting, pagination, and export THEN the system SHALL CONTINUE TO function correctly

3.10 WHEN viewing Invoice Detail fields other than Product (description, quantity, unitPrice, extendedPrice) THEN the system SHALL CONTINUE TO display them correctly

3.11 WHEN viewing Delivery Detail fields other than Product (description, quantity, unitPrice, extendedPrice) THEN the system SHALL CONTINUE TO display them correctly

3.12 WHEN all fixes are applied THEN every fix SHALL have corresponding regression tests (backend integration tests for API changes, frontend E2E tests for UI changes)
