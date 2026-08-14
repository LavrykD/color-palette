const { test, expect } = require('@playwright/test');

test('page loads with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Chevron Color Palette');
});
