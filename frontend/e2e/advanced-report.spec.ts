import { test, expect } from '@playwright/test';

/**
 * Validates: Requirements 17.3, 15.1-15.7
 * E2E tests for the Advanced Report page.
 */

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

    // Wait for at least one card to finish loading and show content
    const contentState = page.locator('.content-state').first();
    await expect(contentState).toBeVisible({ timeout: 15000 });

    // Assert at least one card contains numeric data (currency or number)
    const cardWithData = page.locator('.content-state').filter({ hasText: /\d/ }).first();
    await expect(cardWithData).toBeVisible({ timeout: 10000 });
  });

  test('each card shows response time badge', async ({ page }) => {
    await page.goto('/advanced-report');

    // Wait for at least one card to finish loading
    const contentState = page.locator('.content-state').first();
    await expect(contentState).toBeVisible({ timeout: 15000 });

    // Check response time badges are visible with correct pattern
    const badge = page.locator('.report-card .response-time-badge').first();
    await expect(badge).toBeVisible({ timeout: 10000 });
    await expect(badge).toHaveText(/Loaded in \d+ms/);
  });

  test('error isolation — one failed endpoint shows error only on that card', async ({ page }) => {
    // Intercept top-drivers endpoint with 500 response
    await page.route('**/api/advancedreport/top-drivers', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/advanced-report');

    // Wait for non-intercepted cards to load
    const contentState = page.locator('.content-state').first();
    await expect(contentState).toBeVisible({ timeout: 15000 });

    // The Top Drivers card should show error state
    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Wait for most cards to finish loading before counting
    await page.waitForTimeout(3000);

    // Other cards should still show data normally (at least some content-state visible)
    const loadedCards = page.locator('.content-state');
    expect(await loadedCards.count()).toBeGreaterThanOrEqual(10);
  });

  test('Sales Trend period selector works', async ({ page }) => {
    await page.goto('/advanced-report');

    // Wait for sales trend card to load
    const periodBtn = page.locator('.period-btn').first();
    await expect(periodBtn).toBeVisible({ timeout: 15000 });

    // Click "week" button
    const weekBtn = page.locator('.period-btn', { hasText: 'week' });
    await expect(weekBtn).toBeVisible();

    // Listen for the API call with period=week
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/advancedreport/sales-trend') && resp.url().includes('period=week') && resp.status() === 200,
      { timeout: 10000 }
    );

    await weekBtn.click();

    // Assert active class moved to week button
    await expect(weekBtn).toHaveClass(/active/);

    // Assert API was called with new period
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('dark theme applied to report cards', async ({ page }) => {
    await page.goto('/advanced-report');

    const card = page.locator('.report-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Assert card background color is #2a2a2a
    const bg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(42, 42, 42)');

    // Assert accent color #aaff00 is present (e.g., on rank numbers or big-number)
    // Wait for content to load first
    const contentState = page.locator('.content-state').first();
    await expect(contentState).toBeVisible({ timeout: 15000 });

    const accentEl = page.locator('.rank, .big-number, .stat-value.accent, .period-btn.active').first();
    await expect(accentEl).toBeVisible();
    const color = await accentEl.evaluate((el) => getComputedStyle(el).color);
    // The accent color should be #aaff00 = rgb(170, 255, 0) on text,
    // or on background for active period button
    const bgColor = await accentEl.evaluate((el) => getComputedStyle(el).backgroundColor);
    const hasAccent = color === 'rgb(170, 255, 0)' || bgColor === 'rgb(170, 255, 0)';
    expect(hasAccent).toBe(true);
  });
});
