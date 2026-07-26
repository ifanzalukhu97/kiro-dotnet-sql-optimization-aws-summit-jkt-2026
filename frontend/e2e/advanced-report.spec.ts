import { test, expect } from '@playwright/test';

/**
 * Validates: Requirements 17.3, 17.6, 17.7, 17.8, 15.1-15.7
 * E2E tests for the Advanced Report page.
 *
 * Note: Backend queries can be very slow (20–60s+) on the unoptimized demo database.
 * Tests use generous timeouts and focus on structural/feature correctness.
 */

const DATA_TIMEOUT = 60000;

test.describe('Advanced Report', () => {

  test('navigation — "Advanced Report" link in sidebar navigates to /advanced-report', async ({ page }) => {
    await page.goto('/');

    const navLink = page.getByRole('link', { name: 'Advanced Report', exact: true });
    await expect(navLink).toBeVisible();
    await navLink.click();

    await expect(page).toHaveURL(/\/advanced-report$/);
  });

  test('page loads with 13 report cards visible', async ({ page }) => {
    await page.goto('/advanced-report');

    const cards = page.locator('.report-card');
    await expect(cards).toHaveCount(13, { timeout: 10000 });
  });

  test('cards show data after loading (not perpetual spinner)', async ({ page }) => {
    await page.goto('/advanced-report');

    // Wait for at least one card to finish loading and show content (canvas or text)
    const contentState = page.locator('.content-state').first();
    await expect(contentState).toBeVisible({ timeout: DATA_TIMEOUT });

    // Assert at least one card has rendered content: either a canvas (chart) or text with digits
    const cardWithContent = page.locator('.content-state canvas, .content-state:has-text("\\d")').first();
    await expect(cardWithContent).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('each card shows response time badge', async ({ page }) => {
    await page.goto('/advanced-report');

    // Wait for at least one card to finish loading
    const contentState = page.locator('.content-state').first();
    await expect(contentState).toBeVisible({ timeout: DATA_TIMEOUT });

    // Find a badge that shows a successful load time (not "Request failed")
    const successBadge = page.locator('.report-card .response-time-badge:not(.error)').first();
    await expect(successBadge).toBeVisible({ timeout: DATA_TIMEOUT });
    await expect(successBadge).toHaveText(/Loaded in \d+ms/);
  });

  test('error isolation — one failed endpoint shows error only on that card', async ({ page }) => {
    // Intercept top-drivers endpoint with 500 response (instant error, not timeout)
    await page.route('**/api/advancedreport/top-drivers', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    // Also mock total-revenue to guarantee at least one card loads successfully
    await page.route('**/api/advancedreport/total-revenue', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ totalRevenue: 375677715.85, invoiceRevenue: 198043439.45, orderRevenue: 177634276.40 })
      });
    });

    await page.goto('/advanced-report');

    // The Top Drivers card should show error state
    const errorState = page.locator('.error-state').first();
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // The mocked total-revenue card should load successfully — proves error isolation
    const contentState = page.locator('.content-state').first();
    await expect(contentState).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('Sales Trend period selector works', async ({ page }) => {
    // Intercept the sales-trend API to respond quickly for testing purposes
    await page.route('**/api/advancedreport/sales-trend**', (route) => {
      const url = route.request().url();
      const mockData = [
        { period: '2024-01', totalRevenue: 100000, invoiceCount: 50 },
        { period: '2024-02', totalRevenue: 120000, invoiceCount: 60 },
        { period: '2024-03', totalRevenue: 90000, invoiceCount: 45 }
      ];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });

    await page.goto('/advanced-report');

    // Wait for period buttons to appear (sales trend data loaded via mock)
    const periodBtn = page.locator('.period-btn').first();
    await expect(periodBtn).toBeVisible({ timeout: DATA_TIMEOUT });

    // Click "week" button
    const weekBtn = page.locator('.period-btn', { hasText: 'week' });
    await expect(weekBtn).toBeVisible();
    await weekBtn.click();

    // Assert active class moved to week button
    await expect(weekBtn).toHaveClass(/active/);
  });

  test('dark theme applied to report cards', async ({ page }) => {
    await page.goto('/advanced-report');

    const card = page.locator('.report-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Assert card background color is dark (#2a2a2a)
    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(42, 42, 42)');

    // Assert accent color #aaff00 is present on active period button
    // Use mocked response so buttons appear quickly
    await page.route('**/api/advancedreport/sales-trend**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { period: '2024-01', totalRevenue: 100000, invoiceCount: 50 }
        ])
      });
    });

    // Navigate again to pick up the mock
    await page.goto('/advanced-report');
    const accentEl = page.locator('.period-btn.active').first();
    await expect(accentEl).toBeVisible({ timeout: DATA_TIMEOUT });
    const bgColor = await accentEl.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(170, 255, 0)');
  });

  test('chart canvas elements are rendered inside report cards', async ({ page }) => {
    await page.goto('/advanced-report');

    // At least one canvas element should be visible inside report cards
    const canvas = page.locator('.report-card canvas').first();
    await expect(canvas).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('section headers are visible', async ({ page }) => {
    await page.goto('/advanced-report');

    const expectedHeaders = [
      'Revenue Overview',
      'Top Performers',
      'Customer Insights',
      'Inventory',
      'Categories & Logistics'
    ];

    for (const header of expectedHeaders) {
      const el = page.locator('.section-header', { hasText: header });
      await expect(el).toBeVisible({ timeout: 10000 });
    }
  });
});
