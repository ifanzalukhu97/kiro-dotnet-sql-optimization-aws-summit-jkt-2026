import { test, expect } from '@playwright/test';

/**
 * Validates: Requirement 14.7
 * Dark mode theme colors are applied correctly.
 */

test.describe('Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('body background is #121212', async ({ page }) => {
    const bg = await page.locator('body').evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    expect(bg).toBe('rgb(18, 18, 18)');
  });

  test('sidebar background is #1a1a1a', async ({ page }) => {
    const bg = await page.locator('.sidebar').evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    expect(bg).toBe('rgb(26, 26, 26)');
  });

  test('accent color #aaff00 is used on active nav link', async ({ page }) => {
    const color = await page.locator('.nav-links li a.active').first().evaluate(
      el => getComputedStyle(el).color
    );
    expect(color).toBe('rgb(170, 255, 0)');
  });

  test('surface color #2a2a2a is used on cards', async ({ page }) => {
    const bg = await page.locator('.card').first().evaluate(
      el => getComputedStyle(el).backgroundColor
    );
    expect(bg).toBe('rgb(42, 42, 42)');
  });
});
