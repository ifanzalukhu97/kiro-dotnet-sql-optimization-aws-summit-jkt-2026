# Requirements Document

## Introduction

This document captures requirements for the Advanced Reports feature and a bugfix for inventory stock ordering in the WideWorldImporters demo application. The Advanced Reports feature adds a dedicated "Advanced Report" section to the application with 13 report cards, each served by its own API endpoint so the frontend can load them in parallel for a fast user experience. Additionally, a bug is fixed where sorting by "Quantity on Hand" in the Inventory/Stock list page does not work because the backend does not handle this sort column.

## Glossary

- **Advanced Report**: A new section/page in the application containing multiple report cards displaying aggregated business intelligence data
- **Report Card**: A single visual component on the Advanced Report page showing one specific metric or ranking (e.g., "Top 10 Customers")
- **Parallel Loading**: Frontend pattern where multiple independent API calls are made simultaneously to reduce total page load time
- **Revenue**: The sum of monetary values from invoices (`InvoiceLine.ExtendedPrice`) and orders (`OrderLine.Quantity * OrderLine.UnitPrice`)
- **Active Customer**: A customer who has placed at least one order within a configurable recent period (default: last 90 days)
- **Dormant Customer**: A customer whose most recent order date is the longest time ago compared to other customers
- **Outstanding Balance**: The sum of `CustomerTransaction.OutstandingBalance` for a customer
- **Sales Trend**: Aggregated revenue data grouped by time period (week, month, or year) for comparison
- **Stock Group**: A product category grouping from `Warehouse.StockGroups` linked via `StockItemStockGroups`
- **Driver**: A person (`Application.People`) referenced by `Invoice.SalespersonPersonID` who delivers goods (as used in the existing Delivery module)

## Requirements

### Requirement 1: Advanced Report API — One Endpoint Per Card

**User Story:** As a frontend developer, I want each report card to have its own dedicated API endpoint, so that the frontend can request all cards in parallel and render each independently as data arrives.

#### Acceptance Criteria

1. THE Backend SHALL expose a single controller `AdvancedReportController` at route prefix `api/advancedreport` containing 13 separate GET endpoints, one for each report card
2. EACH endpoint SHALL be independently callable and return its own JSON response without depending on or waiting for any other report endpoint
3. EACH endpoint SHALL complete within 5 seconds on the standard WideWorldImporters-Full dataset under normal load
4. IF any single endpoint fails (database error, timeout), THEN it SHALL return an appropriate HTTP error status (500/503) without affecting the availability of other endpoints
5. THE Frontend SHALL call all 13 endpoints in parallel when the Advanced Report page loads, rendering each card independently as its response arrives

### Requirement 2: Total Revenue Report (Invoices + Orders)

**User Story:** As a business analyst, I want to see the total combined revenue from invoices and orders with a visual breakdown, so that I can understand the revenue composition at a glance.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/total-revenue` SHALL return a JSON response containing: `totalRevenue` (decimal), `invoiceRevenue` (decimal), `orderRevenue` (decimal)
2. THE `invoiceRevenue` SHALL be calculated as `SUM(InvoiceLines.ExtendedPrice)` across all invoice lines
3. THE `orderRevenue` SHALL be calculated as `SUM(OrderLines.Quantity * OrderLines.UnitPrice)` across all order lines
4. THE `totalRevenue` SHALL equal `invoiceRevenue + orderRevenue`
5. THE Frontend card SHALL display `totalRevenue` as the primary value and show `invoiceRevenue` and `orderRevenue` as a hoverable/tooltip breakdown on the graphic/chart element

### Requirement 3: Top 10 Customers Report

**User Story:** As a sales manager, I want to see the top 10 customers ranked by total revenue, so that I can identify our most valuable clients.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/top-customers` SHALL return a JSON array of the top 10 customers ordered by total revenue descending
2. EACH item in the array SHALL contain: `customerId` (int), `customerName` (string), `totalRevenue` (decimal)
3. THE `totalRevenue` for each customer SHALL be calculated as the sum of `InvoiceLines.ExtendedPrice` for all invoices belonging to that customer
4. THE response SHALL contain exactly 10 items (or fewer if the database has fewer than 10 customers with revenue)

### Requirement 4: Top 10 Salesman Report

**User Story:** As a sales director, I want to see the top 10 salespeople ranked by total revenue generated, so that I can identify high performers.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/top-salesman` SHALL return a JSON array of the top 10 salespeople ordered by total revenue descending
2. EACH item in the array SHALL contain: `personId` (int), `fullName` (string), `totalRevenue` (decimal)
3. THE `totalRevenue` for each salesperson SHALL be calculated as the sum of `InvoiceLines.ExtendedPrice` for all invoices where `Invoice.SalespersonPersonID` matches the person
4. THE response SHALL contain exactly 10 items (or fewer if the database has fewer than 10 salespeople with revenue)

### Requirement 5: Top 10 Products Report

**User Story:** As a product manager, I want to see the top 10 products ranked by total sales revenue, so that I can identify bestsellers.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/top-products` SHALL return a JSON array of the top 10 products ordered by total revenue descending
2. EACH item in the array SHALL contain: `stockItemId` (int), `stockItemName` (string), `totalRevenue` (decimal), `totalQuantitySold` (int)
3. THE `totalRevenue` for each product SHALL be calculated as `SUM(InvoiceLines.ExtendedPrice)` for all invoice lines referencing that stock item
4. THE `totalQuantitySold` SHALL be calculated as `SUM(InvoiceLines.Quantity)` for the same invoice lines
5. THE response SHALL contain exactly 10 items (or fewer if the database has fewer than 10 products with sales)

### Requirement 6: Customer Activity Report (Total vs Active)

**User Story:** As a marketing manager, I want to see total customers versus active customers who still need to buy, so that I can understand customer engagement and plan re-engagement campaigns.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/customer-activity` SHALL return a JSON response containing: `totalCustomers` (int), `activeCustomers` (int), `inactiveCustomers` (int), `activePercentage` (decimal)
2. THE `totalCustomers` SHALL be the total count of all customers in the database
3. THE `activeCustomers` SHALL be the count of customers who have at least one order with `OrderDate` within the last 90 days from today
4. THE `inactiveCustomers` SHALL equal `totalCustomers - activeCustomers`
5. THE `activePercentage` SHALL be `(activeCustomers / totalCustomers) * 100` rounded to 2 decimal places

### Requirement 7: Sales Trend Report (Period Comparison)

**User Story:** As a business analyst, I want to compare sales performance across time periods (week-to-week, month-to-month, year-to-year), so that I can identify growth trends and seasonal patterns.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/sales-trend` SHALL accept an optional query parameter `period` with values `week`, `month` (default), or `year`
2. THE endpoint SHALL return a JSON array of time-period buckets ordered chronologically, each containing: `periodLabel` (string, e.g., "2024-01", "2024-W05", "2024"), `revenue` (decimal), `orderCount` (int)
3. WHEN `period=month`, THE response SHALL group revenue by calendar month (format "YYYY-MM") for the last 12 months
4. WHEN `period=week`, THE response SHALL group revenue by ISO week (format "YYYY-Www") for the last 12 weeks
5. WHEN `period=year`, THE response SHALL group revenue by calendar year (format "YYYY") for all available years in the data
6. THE `revenue` per period SHALL be calculated as `SUM(InvoiceLines.ExtendedPrice)` for invoices whose `InvoiceDate` falls within the period
7. THE `orderCount` per period SHALL be the count of distinct orders whose `OrderDate` falls within the period

### Requirement 8: Low Stock Report (Top 10 Nearly Out of Stock)

**User Story:** As a warehouse manager, I want to see the top 10 products closest to running out of stock, so that I can prioritize reordering.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/low-stock` SHALL return a JSON array of the 10 stock items with the lowest `QuantityOnHand` ordered ascending
2. EACH item SHALL contain: `stockItemId` (int), `stockItemName` (string), `quantityOnHand` (int), `reorderLevel` (int), `targetStockLevel` (int)
3. THE items SHALL only include stock items where `QuantityOnHand <= ReorderLevel` (i.e., at or below reorder threshold), unless fewer than 10 items meet that criteria, in which case return the 10 lowest regardless
4. THE response SHALL contain exactly 10 items (or fewer if the database has fewer than 10 stock items)

### Requirement 9: High Stock Report (Top 10 Overstocked)

**User Story:** As a warehouse manager, I want to see the top 10 products with the highest stock levels, so that I can identify potential overstocking.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/high-stock` SHALL return a JSON array of the 10 stock items with the highest `QuantityOnHand` ordered descending
2. EACH item SHALL contain: `stockItemId` (int), `stockItemName` (string), `quantityOnHand` (int), `reorderLevel` (int), `targetStockLevel` (int)
3. THE response SHALL contain exactly 10 items (or fewer if the database has fewer than 10 stock items with holdings)

### Requirement 10: Top 10 Outstanding Balance Report

**User Story:** As a finance manager, I want to see the top 10 customers with the highest outstanding balances, so that I can prioritize collection efforts.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/top-outstanding` SHALL return a JSON array of the top 10 customers ordered by total outstanding balance descending
2. EACH item SHALL contain: `customerId` (int), `customerName` (string), `outstandingBalance` (decimal)
3. THE `outstandingBalance` for each customer SHALL be calculated as `SUM(CustomerTransactions.OutstandingBalance)` for all transactions belonging to that customer
4. THE response SHALL only include customers with `outstandingBalance > 0`
5. THE response SHALL contain exactly 10 items (or fewer if fewer than 10 customers have a positive outstanding balance)

### Requirement 11: Top 10 Dormant Customers Report

**User Story:** As a sales manager, I want to see the top 10 customers who haven't ordered in the longest time, so that I can plan re-engagement outreach.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/dormant-customers` SHALL return a JSON array of the top 10 customers ordered by their last order date ascending (oldest first)
2. EACH item SHALL contain: `customerId` (int), `customerName` (string), `lastOrderDate` (datetime), `daysSinceLastOrder` (int)
3. THE `lastOrderDate` SHALL be the maximum `OrderDate` from `Sales.Orders` for each customer
4. THE `daysSinceLastOrder` SHALL be calculated as the number of days between today and `lastOrderDate`
5. THE response SHALL only include customers who have placed at least one order (exclude customers with zero orders)
6. THE response SHALL contain exactly 10 items (or fewer if the database has fewer than 10 customers with orders)

### Requirement 12: Top 5 Sales by Stock Group Report

**User Story:** As a category manager, I want to see the top 5 product stock groups by sales revenue, so that I can identify which product categories drive the most business.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/top-stock-groups` SHALL return a JSON array of the top 5 stock groups ordered by total revenue descending
2. EACH item SHALL contain: `stockGroupId` (int), `stockGroupName` (string), `totalRevenue` (decimal), `productCount` (int)
3. THE `totalRevenue` for each stock group SHALL be calculated by summing `InvoiceLines.ExtendedPrice` for all invoice lines whose `StockItemID` belongs to that stock group (via `StockItemStockGroups`)
4. THE `productCount` SHALL be the number of distinct stock items in that group
5. THE response SHALL contain exactly 5 items (or fewer if the database has fewer than 5 stock groups with sales)

### Requirement 13: Top 5 Sales by Supplier Report

**User Story:** As a procurement manager, I want to see the top 5 suppliers by sales revenue of their products, so that I can identify our most commercially important suppliers.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/top-suppliers` SHALL return a JSON array of the top 5 suppliers ordered by total revenue descending
2. EACH item SHALL contain: `supplierId` (int), `supplierName` (string), `totalRevenue` (decimal), `productCount` (int)
3. THE `totalRevenue` for each supplier SHALL be calculated by summing `InvoiceLines.ExtendedPrice` for all invoice lines whose `StockItemID` references a stock item supplied by that supplier (`StockItem.SupplierID`)
4. THE `productCount` SHALL be the number of distinct stock items supplied by that supplier
5. THE response SHALL contain exactly 5 items (or fewer if the database has fewer than 5 suppliers with product sales)

### Requirement 14: Top 5 Drivers by Performance Report

**User Story:** As a logistics manager, I want to see the top 5 drivers ranked by number of deliveries completed, so that I can recognize high performers.

#### Acceptance Criteria

1. THE endpoint `GET /api/advancedreport/top-drivers` SHALL return a JSON array of the top 5 drivers (persons) ordered by delivery count descending
2. EACH item SHALL contain: `personId` (int), `fullName` (string), `deliveryCount` (int), `totalRevenueDelivered` (decimal)
3. THE `deliveryCount` for each driver SHALL be the count of invoices where `Invoice.SalespersonPersonID` matches the person
4. THE `totalRevenueDelivered` SHALL be the sum of `InvoiceLines.ExtendedPrice` for all invoices delivered by that driver
5. THE response SHALL only include persons who are employees (`Person.IsEmployee = true`)
6. THE response SHALL contain exactly 5 items (or fewer if the database has fewer than 5 employee drivers with deliveries)

### Requirement 15: Advanced Report Frontend Page

**User Story:** As a demo audience member, I want to see all advanced report cards on a single page that loads quickly, so that I get a comprehensive business overview without waiting for a single massive API call.

#### Acceptance Criteria

1. THE Frontend SHALL include an "Advanced Report" navigation link in the sidebar that navigates to a dedicated `/advanced-report` page
2. WHEN the Advanced Report page loads, THE Frontend SHALL make all 13 API calls in parallel using concurrent HTTP requests
3. EACH report card SHALL render independently as soon as its API response arrives, showing a loading spinner until data is available
4. EACH report card SHALL display a Response_Time_Badge showing the elapsed time for its specific API call
5. IF an individual report card API call fails, THEN that card SHALL display an error message while other cards continue to load and display normally
6. THE page layout SHALL organize the 13 report cards in a responsive grid (e.g., 2-3 columns on desktop, 1 column on mobile)
7. THE Frontend SHALL apply the existing dark-mode theme (`#121212` background, `#aaff00` accent) consistently to all report cards

### Requirement 16: Inventory Stock Ordering Bugfix

**User Story:** As a user viewing the Inventory/Stock list page, I want to sort by "Quantity on Hand" column and see the data actually change order, so that I can quickly find items with low or high stock.

#### Acceptance Criteria

1. WHEN the user clicks the "Quantity on Hand" column header on the Inventory/Stock list page, THE Backend SHALL sort the stock items by their `QuantityOnHand` value from `StockItemHoldings` in the requested direction (asc or desc)
2. THE sorting SHALL happen at the database query level (before pagination), so that the paginated results reflect the correct sort order across all pages
3. THE Backend `StockItemsController` SHALL support `sortBy=quantityonhand` in its `ApplySort` method, joining with `StockItemHoldings` to enable database-level sorting
4. THE existing sort options (`stockitemid`, `stockitemname`, `unitprice`, `recommendedretailprice`) SHALL continue to work as before
5. THE Frontend SHALL already send `sortBy=quantityonhand` when the column header is clicked (the frontend is already capable; only the backend is missing the handler)
6. THE fix SHALL include refactoring the `StockItemsController.GetStockItems` method to load `QuantityOnHand` via a join (instead of the current per-item loop) so that sorting can be applied at the query level before pagination

### Requirement 17: Test Coverage for All Changes

**User Story:** As a developer, I want all new endpoints and the bugfix to be covered by integration tests (backend) and E2E tests (frontend), so that regressions are caught early.

#### Acceptance Criteria

1. THE Backend SHALL include integration tests for all 13 new Advanced Report endpoints, verifying: HTTP 200 status, correct JSON response shape, correct data types for each field
2. THE Backend SHALL include an integration test for the inventory `sortBy=quantityonhand` fix verifying that results are correctly ordered when sorting ascending and descending
3. THE Frontend SHALL include Playwright E2E tests verifying: the Advanced Report page loads, all 13 cards render with data, individual card loading/error states work correctly
4. THE Frontend SHALL include a Playwright E2E test verifying that sorting by Quantity on Hand on the Inventory page produces different data ordering
5. ALL existing backend integration tests SHALL continue to pass after the changes
6. ALL existing frontend E2E tests SHALL continue to pass after the changes
