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

      // Find the dropdown select element(s)
      const selects = page.locator('.dropdown-filter__select');
      const targetSelect = selects.nth(selectIndex ?? 0);
      await expect(targetSelect).toBeVisible({ timeout: 5000 });

      // Wait for options to be populated (at least placeholder + 1 real option)
      await expect(targetSelect.locator('option')).not.toHaveCount(0, { timeout: 10000 });
      const optionCount = await targetSelect.locator('option').count();
      expect(optionCount).toBeGreaterThanOrEqual(2);

      // Get a non-default option value
      const firstRealOption = targetSelect.locator('option').nth(1);
      const optionValue = await firstRealOption.getAttribute('value');
      expect(optionValue).toBeTruthy();

      // Listen for the API response triggered by filter change
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes('/api/') && resp.url().includes('page') && resp.status() === 200,
        { timeout: 10000 }
      );

      // Select the non-default option
      await targetSelect.selectOption(optionValue!);

      // Verify a new API call was made
      const response = await responsePromise;
      expect(response.status()).toBe(200);
    });
  }
});
