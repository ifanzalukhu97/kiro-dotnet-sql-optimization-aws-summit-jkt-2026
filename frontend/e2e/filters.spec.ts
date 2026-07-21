import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 14.5
 * Dropdown selection triggers data refresh on pages with filters.
 */

const filterPages = [
  {
    label: 'Orders',
    path: '/orders',
    apiPattern: '**/api/orders?*',
  },
  {
    label: 'Warehouse',
    path: '/warehouse',
    apiPattern: '**/api/warehouse?*',
  },
  {
    label: 'Orders (Product filter)',
    path: '/orders',
    apiPattern: '**/api/orders?*',
    selectIndex: 1,
  },
];

test.describe('Filter Interactions', () => {
  for (const { label, path, apiPattern, selectIndex } of filterPages) {
    test(`${label} — dropdown selection triggers data refresh`, async ({ page }) => {
      await page.goto(path);

      // Wait for table data to load
      const tableRow = page.locator('tbody tr').first();
      await expect(tableRow).toBeVisible({ timeout: 10000 });

      // Click trigger to open multi-select panel
      const filterContainer = page.locator('.dropdown-filter').nth(selectIndex ?? 0);
      const trigger = filterContainer.locator('.dropdown-filter__trigger');
      await expect(trigger).toBeVisible({ timeout: 5000 });
      await trigger.click();

      // Wait for panel (scoped to the same filter container)
      const panel = filterContainer.locator('.dropdown-filter__panel');
      await expect(panel).toBeVisible();

      // Check first checkbox option
      const firstCheckbox = panel.locator('input[type="checkbox"]').first();
      await expect(firstCheckbox).toBeVisible({ timeout: 10000 });

      // Listen for the API response triggered by filter change
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/api/') && resp.url().includes('page') && resp.status() === 200,
        { timeout: 15000 }
      );

      await firstCheckbox.check();

      // Verify a new API call was made
      const response = await responsePromise;
      expect(response.status()).toBe(200);
    });
  }
});
