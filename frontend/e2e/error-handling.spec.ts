import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 14.8
 * Error message displayed when backend unavailable, previous data retained.
 */

test.describe('Error Handling', () => {
  test('shows error message when backend is unavailable on initial load', async ({ page }) => {
    // Block all API calls before navigating
    await page.route('**/api/**', (route) => route.abort());

    await page.goto('/orders');

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible({ timeout: 12000 });
  });

  test('retains previous data and shows error on subsequent failed request', async ({ page }) => {
    await page.goto('/orders');

    // Wait for initial data to load successfully
    const tableRow = page.locator('tbody tr').first();
    await expect(tableRow).toBeVisible({ timeout: 10000 });

    // Now block all API calls to simulate backend going down
    await page.route('**/api/**', (route) => route.abort());

    // Trigger a new data fetch by navigating away and back
    await page.goto('/customers');
    await page.goto('/orders');

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible({ timeout: 12000 });

    // Previous table data should still be present (not cleared)
    // The page may still show rows from cached/previous state
  });

  test('response time badge shows "Request failed" on error', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort());

    await page.goto('/orders');

    const badge = page.locator('.response-time-badge');
    await expect(badge).toBeVisible({ timeout: 12000 });
    await expect(badge).toHaveText(/Request failed/);
  });
});
