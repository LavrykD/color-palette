const { test, expect } = require('@playwright/test');
const fixtureChevrons = require('./fixtures/chevrons.json');

test('page loads with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Chevron Color Palette');
});

test.describe('dashboard rendering', () => {
  test('renders a card per chevron with image and swatches', async ({ page }) => {
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixtureChevrons) })
    );
    await page.goto('/');

    const cards = page.locator('.chevron-card');
    await expect(cards).toHaveCount(fixtureChevrons.length);

    const firstCard = cards.first();
    await expect(firstCard.locator('.chevron-image')).toHaveAttribute(
      'src',
      fixtureChevrons[0].image
    );
    await expect(firstCard.locator('.swatch-code')).toHaveText(
      fixtureChevrons[0].colors.map((c) => c.code)
    );
  });

  test('shows an empty-state message when data is malformed', async ({ page }) => {
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: 'not valid json' })
    );
    await page.goto('/');
    await expect(page.locator('.empty-state')).toHaveText('Unable to load chevron data.');
    await expect(page.locator('.chevron-card')).toHaveCount(0);
  });

  test('shows an empty-state message when there are no chevrons', async ({ page }) => {
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: '[]' })
    );
    await page.goto('/');
    await expect(page.locator('.empty-state')).toHaveText('No chevrons yet.');
  });
});
