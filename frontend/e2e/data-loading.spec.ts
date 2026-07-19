import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 14.4
 * Data appears in tables/lists within 10 seconds of navigation.
 */

const dataPages = [
  { label: 'Orders', path: '/orders' },
  { label: 'Customers', path: '/customers' },
  { label: 'Suppliers', path: '/suppliers' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Purchase Orders', path: '/purchase-orders' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Deliveries', path: '/deliveries' },
  { label: 'Warehouse', path: '/warehouse' },
];

test.describe('Data Loading', () => {
  for (const { label, path } of dataPages) {
    test(`${label} page loads data in table within 10s`, async ({ page }) => {
      await page.goto(path);

      const tableRow = page.locator('tbody tr').first();
      await expect(tableRow).toBeVisible({ timeout: 10000 });
    });
  }
});
