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
    await expect(firstCard.locator('.swatch-index')).toHaveText(
      fixtureChevrons[0].colors.map((_, i) => `#${i + 1}`)
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

  test('shows a placeholder when a chevron image fails to load', async ({ page }) => {
    const broken = { ...fixtureChevrons[0], image: 'images/does-not-exist.png' };
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify([broken]) })
    );
    await page.goto('/');
    await expect(page.locator('.chevron-image')).toHaveClass(/chevron-image--broken/);
  });

  test('skips a single malformed entry and still renders the good ones', async ({ page }) => {
    const malformed = { ...fixtureChevrons[0], colors: undefined };
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([malformed, fixtureChevrons[1], fixtureChevrons[2]]),
      })
    );
    await page.goto('/');
    await expect(page.locator('.chevron-card')).toHaveCount(2);
  });

  test('lays out cards in more columns on wide viewports than narrow ones', async ({ page }) => {
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixtureChevrons) })
    );

    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    const mobileColumns = await page
      .locator('.chevron-grid')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim().split(' ').length);

    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopColumns = await page
      .locator('.chevron-grid')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.trim().split(' ').length);

    expect(desktopColumns).toBeGreaterThan(mobileColumns);
  });

  test('increases blur and lift on hover', async ({ page }) => {
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixtureChevrons) })
    );
    await page.goto('/');

    const card = page.locator('.chevron-card').first();
    const restingBlur = await card.evaluate((el) => getComputedStyle(el).backdropFilter);

    await card.hover();
    // Wait for the :hover pseudo-class to propagate through the browser's style engine
    // to the next animation frame, ensuring getComputedStyle reflects the hover state.
    await page.waitForFunction(
      () => window.getComputedStyle(document.querySelector('.chevron-card')).backdropFilter !== 'blur(0px)',
      { timeout: 1000 }
    );
    const hoverBlur = await card.evaluate((el) => getComputedStyle(el).backdropFilter);

    expect(hoverBlur).not.toBe(restingBlur);
    expect(hoverBlur).toContain('blur');
  });
});
