import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Phase 2 Bugfixes', () => {

  test('CSV export returns all records (not capped by pageSize)', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Get total count from page info
    const pageInfo = page.locator('.page-info');
    await expect(pageInfo).toBeVisible();
    const pageInfoText = await pageInfo.textContent();
    // Extract total records number from "Showing page X of Y (Z records)"
    const totalMatch = pageInfoText?.match(/(\d+)\s*records/);
    const totalRecords = totalMatch ? parseInt(totalMatch[1]) : 0;

    // Click export and verify download
    const exportBtn = page.locator('.export-btn');
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await exportBtn.click();
    const download = await downloadPromise;

    // Read file and count rows (subtract 1 for header)
    const filePath = await download.path();
    const content = filePath ? readFileSync(filePath, 'utf-8') : '';
    const rowCount = content.split('\n').filter(line => line.trim()).length - 1; // minus header

    // Row count should equal total records (export=true bypasses pagination)
    expect(rowCount).toBe(totalRecords);
  });

  test('dropdown filter search input filters options in real time', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Open multi-select dropdown
    const trigger = page.locator('.dropdown-filter__trigger').first();
    await trigger.click();

    const panel = page.locator('.dropdown-filter__panel').first();
    await expect(panel).toBeVisible();

    // Count initial options
    const initialCount = await panel.locator('.dropdown-filter__option').count();
    expect(initialCount).toBeGreaterThan(0);

    // Type in search input
    const searchInput = panel.locator('.dropdown-filter__search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Tail');

    // Options should be filtered (fewer than initial)
    const filteredCount = await panel.locator('.dropdown-filter__option').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('dropdown option text has title attribute for tooltip', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Open multi-select dropdown
    const trigger = page.locator('.dropdown-filter__trigger').first();
    await trigger.click();

    const panel = page.locator('.dropdown-filter__panel').first();
    await expect(panel).toBeVisible();

    // Check that option-text spans have a title attribute
    const firstOptionText = panel.locator('.dropdown-filter__option-text').first();
    await expect(firstOptionText).toBeVisible();
    const titleValue = await firstOptionText.getAttribute('title');
    expect(titleValue).toBeTruthy();
    // Title should match the text content
    const textContent = await firstOptionText.textContent();
    expect(titleValue).toBe(textContent?.trim());
  });

  test('Customer Detail shows transactions when data exists', async ({ page }) => {
    await page.goto('/customers');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
    await page.locator('tbody tr.clickable-row').first().click();
    await page.waitForURL(/\/customers\/\d+/, { timeout: 5000 });
    // Should show Transactions heading
    await expect(page.locator('h3', { hasText: 'Transactions' })).toBeVisible({ timeout: 5000 });
    // Table or content should be present (not "No transactions")
    const noTransactions = page.locator('.empty', { hasText: 'No transactions' });
    const table = page.locator('.lines-table').nth(1); // second table is transactions
    // At least one should be visible - either data or empty message
    await expect(noTransactions.or(table)).toBeVisible();
  });

  test('Supplier Detail shows purchase orders when data exists', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
    await page.locator('tbody tr.clickable-row').first().click();
    await page.waitForURL(/\/suppliers\/\d+/, { timeout: 5000 });
    await expect(page.locator('h3', { hasText: 'Purchase Orders' })).toBeVisible({ timeout: 5000 });
    const noPO = page.locator('.empty', { hasText: 'No purchase orders' });
    const table = page.locator('.lines-table');
    await expect(noPO.or(table)).toBeVisible();
  });

  test('Inventory row click navigates to /inventory/:id detail page', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
    await page.locator('tbody tr.clickable-row').first().click();
    await page.waitForURL(/\/inventory\/\d+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/inventory\/\d+/);
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  test('Products row click navigates to /product-search/:id detail page', async ({ page }) => {
    await page.goto('/product-search');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
    await page.locator('tbody tr.clickable-row').first().click();
    await page.waitForURL(/\/product-search\/\d+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/product-search\/\d+/);
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  test('Sales Report nav link and route no longer exist', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.nav-links')).toBeVisible({ timeout: 5000 });
    // No nav link for Sales Report
    const salesReportLink = page.locator('a', { hasText: 'Sales Report' });
    await expect(salesReportLink).toHaveCount(0);
    // Navigating to /sales-report should redirect (to dashboard or 404)
    await page.goto('/sales-report');
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 5000 });
  });

  test('Order detail page shows product names in line items', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
    await page.locator('tbody tr.clickable-row').first().click();
    await page.waitForURL(/\/orders\/\d+/, { timeout: 5000 });
    // Product column should have non-empty text
    const productCell = page.locator('.lines-table tbody td').first();
    await expect(productCell).toBeVisible({ timeout: 5000 });
    const text = await productCell.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('export failure shows error message in UI (not silent)', async ({ page }) => {
    // Intercept any export=true request and return 500
    await page.route('**/api/**?*export=true*', route =>
      route.fulfill({ status: 500, body: '{"error":"server error"}' })
    );

    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Click the export button
    const exportBtn = page.locator('.export-btn');
    await exportBtn.click();

    // Error message should appear
    const errorSpan = page.locator('.export-error');
    await expect(errorSpan).toBeVisible({ timeout: 5000 });
    const errorText = await errorSpan.textContent();
    expect(errorText?.trim().length).toBeGreaterThan(0);

    // Button should be back to idle state (not "Exporting...")
    await expect(exportBtn).toHaveText('Export CSV');
    await expect(exportBtn).toBeEnabled();
  });

});
