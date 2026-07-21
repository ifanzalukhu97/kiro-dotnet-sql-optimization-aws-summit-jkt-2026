import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 14.3
 * All 12 pages are reachable via the navigation menu links.
 */

const navPages = [
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

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  for (const { label, path } of navPages) {
    test(`navigates to ${label} page via nav menu`, async ({ page }) => {
      const navLink = page.getByRole('link', { name: label, exact: true });
      await navLink.click();

      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(navLink).toHaveClass(/active/);
      await expect(page.locator('main.content')).toBeVisible();
    });
  }

  test('nav menu contains exactly 12 links', async ({ page }) => {
    const links = page.locator('.nav-links a');
    await expect(links).toHaveCount(12);
  });
});
