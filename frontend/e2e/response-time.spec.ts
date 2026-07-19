import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 14.6
 * Response time badge is visible on data pages with "Loaded in {number}ms" pattern.
 */

const dataPages = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Orders', path: '/orders' },
  { label: 'Sales Report', path: '/sales-report' },
  { label: 'Product Search', path: '/product-search' },
  { label: 'Customers', path: '/customers' },
  { label: 'Suppliers', path: '/suppliers' },
  { label: 'Purchase Orders', path: '/purchase-orders' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Deliveries', path: '/deliveries' },
  { label: 'Warehouse', path: '/warehouse' },
  { label: 'Payments', path: '/payments' },
];

test.describe('Response Time Badge', () => {
  for (const { label, path } of dataPages) {
    test(`${label} page shows response time badge with correct text`, async ({ page }) => {
      await page.goto(path);

      const badge = page.locator('.response-time-badge');
      await expect(badge).toBeVisible({ timeout: 10000 });
      await expect(badge).toHaveText(/Loaded in \d+ms/);
    });
  }

  test('badge uses accent color and minimum font size', async ({ page }) => {
    await page.goto('/orders');

    const badge = page.locator('.response-time-badge');
    await expect(badge).toBeVisible({ timeout: 10000 });

    const color = await badge.evaluate((el) => getComputedStyle(el).color);
    // #aaff00 = rgb(170, 255, 0)
    expect(color).toBe('rgb(170, 255, 0)');

    const fontSize = await badge.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    );
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });
});
