import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 14.9
 * Dashboard displays KPI cards with numeric values and chart element.
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for KPI cards to appear (indicates data loaded)
    await page.locator('.kpi-card').first().waitFor({ timeout: 10000 });
  });

  test('KPI cards display numeric values', async ({ page }) => {
    const cards = page.locator('.kpi-card');
    await expect(cards).toHaveCount(8);

    // Each card-value should contain a digit (number or currency)
    const values = page.locator('.kpi-card .card-value');
    const count = await values.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      // At least the numeric cards contain digits; the "Top Customer" card has text
      // We verify that the majority contain digits
      expect(text).not.toBe('');
    }

    // Verify at least 3 cards have numeric content (digits)
    let numericCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      if (text && /\d+/.test(text)) {
        numericCount++;
      }
    }
    expect(numericCount).toBeGreaterThanOrEqual(3);
  });

  test('chart canvas is visible', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('response time badge is present', async ({ page }) => {
    const badge = page.locator('app-response-time-badge');
    await expect(badge).toBeVisible();
    // Badge should show timing (contains "ms")
    await expect(badge).toContainText(/\d+\s*ms/);
  });
});
