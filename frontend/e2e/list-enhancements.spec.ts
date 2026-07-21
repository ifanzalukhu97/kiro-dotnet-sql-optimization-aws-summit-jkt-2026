import { test, expect } from '@playwright/test';

test.describe('List Page Enhancements', () => {

  // --- SEARCH ---

  test('search input is visible on Orders page', async ({ page }) => {
    await page.goto('/orders');
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('search input filters data and updates table', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Type in search input
    const searchInput = page.locator('.search-input');
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/orders') && resp.url().includes('search=') && resp.status() === 200,
      { timeout: 10000 }
    );
    await searchInput.fill('Tailspin');
    // Wait for debounced request
    await responsePromise;
  });

  test('search clear button resets results', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('.search-input');
    await searchInput.fill('Tailspin');
    await page.waitForTimeout(500); // debounce

    // Clear button should appear
    const clearBtn = page.locator('.clear-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Input should be empty
    await expect(searchInput).toHaveValue('');
  });

  // --- SORTING ---

  test('clicking sortable column header triggers sort', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Click on "Order Date" header (sortable)
    const sortableHeader = page.locator('th.sortable', { hasText: 'Order Date' });
    await expect(sortableHeader).toBeVisible();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/orders') && resp.url().includes('sortBy=') && resp.status() === 200,
      { timeout: 10000 }
    );
    await sortableHeader.click();
    await responsePromise;
  });

  // --- ROW NUMBERS ---

  test('data table shows No. column with sequential numbers', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // First header should be "No."
    const firstHeader = page.locator('thead th').first();
    await expect(firstHeader).toHaveText('No.');

    // First row's first cell should be "1"
    const firstRowNumber = page.locator('tbody tr').first().locator('td').first();
    await expect(firstRowNumber).toHaveText('1');
  });

  // --- PAGINATION INFO ---

  test('pagination section shows page info text', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    const pageInfo = page.locator('.page-info');
    await expect(pageInfo).toBeVisible();
    // Should contain "Showing page" text
    await expect(pageInfo).toContainText('Showing page');
    await expect(pageInfo).toContainText('records');
  });

  // --- MULTI-SELECT FILTERS ---

  test('multi-select filter shows dropdown panel on click', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Click the multi-select trigger button
    const trigger = page.locator('.dropdown-filter__trigger').first();
    await expect(trigger).toBeVisible({ timeout: 5000 });
    await trigger.click();

    // Panel should be visible
    const panel = page.locator('.dropdown-filter__panel').first();
    await expect(panel).toBeVisible();

    // Should have checkbox options
    const checkboxes = panel.locator('input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);
  });

  test('multi-select filter shows "N selected" when items checked', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    const trigger = page.locator('.dropdown-filter__trigger').first();
    await trigger.click();

    const panel = page.locator('.dropdown-filter__panel').first();
    await expect(panel).toBeVisible();

    // Check first checkbox
    const firstCheckbox = panel.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    // Trigger text should show "1 selected"
    await expect(trigger).toContainText('selected');
  });

  // --- CSV EXPORT ---

  test('Export CSV button is visible on Orders page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    const exportBtn = page.locator('.export-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toHaveText('Export CSV');
  });

  test('Export CSV button triggers download', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    const exportBtn = page.locator('.export-btn');

    // Listen for download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await exportBtn.click();
    const download = await downloadPromise;

    // Filename should match pattern
    expect(download.suggestedFilename()).toMatch(/orders-export-\d{4}-\d{2}-\d{2}\.csv/);
  });

  // --- DETAIL PAGE NAVIGATION ---

  test('clicking a row navigates to detail page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Click first row
    await page.locator('tbody tr.clickable-row').first().click();

    // Should navigate to /orders/:id
    await page.waitForURL(/\/orders\/\d+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/orders\/\d+/);
  });

  test('detail page has back button that returns to list', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    await page.locator('tbody tr.clickable-row').first().click();
    await page.waitForURL(/\/orders\/\d+/, { timeout: 5000 });

    // Back button should be visible
    const backBtn = page.locator('.back-btn');
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toContainText('Back to list');

    await backBtn.click();
    await page.waitForURL(/\/orders$/, { timeout: 5000 });
  });

  // --- DATE RANGE (Orders specific) ---

  test('Orders page has date range inputs', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    const dateInputs = page.locator('input[type="date"]');
    expect(await dateInputs.count()).toBe(2);
  });

  test('date range filter triggers data refresh', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });

    const startDateInput = page.locator('input[type="date"]').first();

    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/orders') && resp.url().includes('startDate=') && resp.status() === 200,
      { timeout: 10000 }
    );
    await startDateInput.fill('2016-01-01');
    await responsePromise;
  });

  // --- SEARCH ON MULTIPLE PAGES ---

  const searchPages = [
    { label: 'Customers', path: '/customers' },
    { label: 'Suppliers', path: '/suppliers' },
    { label: 'Warehouse', path: '/warehouse' },
  ];

  for (const { label, path } of searchPages) {
    test(`${label} page has search input`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
      const searchInput = page.locator('.search-input');
      await expect(searchInput).toBeVisible();
    });
  }
});
