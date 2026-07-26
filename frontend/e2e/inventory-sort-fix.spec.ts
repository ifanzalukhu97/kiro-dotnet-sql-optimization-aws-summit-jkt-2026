import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 17.4
 * Inventory page sorting by Quantity on Hand works correctly.
 */

test.describe('Inventory Sort by Quantity on Hand', () => {

  test('sort ascending then descending by Qty On Hand', async ({ page }) => {
    await page.goto('/inventory');

    // Wait for table data to load
    const tableRow = page.locator('tbody tr').first();
    await expect(tableRow).toBeVisible({ timeout: 10000 });

    // Find "Qty On Hand" column header (sortable)
    const qtyHeader = page.locator('th.sortable', { hasText: 'Qty On Hand' });
    await expect(qtyHeader).toBeVisible();

    // Click to sort ascending
    const ascResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/stockitems') && resp.url().toLowerCase().includes('sortby=quantityonhand') && resp.status() === 200,
      { timeout: 10000 }
    );
    await qtyHeader.click();
    await ascResponsePromise;

    // Wait for table to re-render
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });

    // Get quantity values from the Qty On Hand column
    // The column is the last one based on the columns config
    const getQtyValues = async () => {
      const rows = page.locator('tbody tr');
      const count = Math.min(await rows.count(), 5);
      const values: number[] = [];
      for (let i = 0; i < count; i++) {
        // Qty On Hand is the last data column; find cell with numeric format
        const cells = rows.nth(i).locator('td');
        const lastCell = cells.last();
        const text = await lastCell.textContent();
        const num = parseInt(text?.replace(/,/g, '').trim() || '0', 10);
        values.push(num);
      }
      return values;
    };

    const ascValues = await getQtyValues();
    // Verify ascending order
    for (let i = 0; i < ascValues.length - 1; i++) {
      expect(ascValues[i]).toBeLessThanOrEqual(ascValues[i + 1]);
    }

    // Click again for descending
    const descResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/stockitems') && resp.url().toLowerCase().includes('sortby=quantityonhand') && resp.status() === 200,
      { timeout: 10000 }
    );
    await qtyHeader.click();
    await descResponsePromise;

    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });

    const descValues = await getQtyValues();
    // Verify descending order
    for (let i = 0; i < descValues.length - 1; i++) {
      expect(descValues[i]).toBeGreaterThanOrEqual(descValues[i + 1]);
    }
  });
});
