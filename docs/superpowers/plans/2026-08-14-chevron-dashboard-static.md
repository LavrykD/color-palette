# Chevron Color Palette Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static chevron color-palette dashboard — a GitHub-Pages-only page that renders chevron images and their color swatches from a local JSON file, with no upload/write path of any kind.

**Architecture:** Plain HTML/CSS/JS, no framework, no build step. `index.html` loads `assets/js/app.js` (ES module), which fetches `data/chevrons.json` and renders one card per chevron into a CSS grid. `assets/css/style.css` handles layout, the resting card style, the "liquid glass" hover state, and responsive columns. Playwright drives a local static file server for all tests; the app's `fetch('data/chevrons.json')` call is intercepted with `page.route` in every test, so tests never depend on (or mutate) the real seed data.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules, no bundler), `@playwright/test` as the only dev dependency, Python's built-in `http.server` as the local static server for tests (no extra server dependency).

**Spec:** `docs/superpowers/specs/2026-08-13-chevron-color-palette-dashboard-design.md`

## Global Constraints

- GitHub Pages only — no server, no build step, no backend of any kind.
- No database — all data lives in `data/chevrons.json` and is served as static JSON.
- No in-app write path — no upload form, no GitHub API calls, no token handling, no client-side persistence standing in for real data. Adding a chevron is a manual file edit + commit, done by the maintainer.
- `package.json` exists only to hold the Playwright dev dependency — it is never part of the deployed site.
- Chevron `id`s are slugs; color `id`s follow `<chevron-id>-color-<n>`.

---

### Task 1: Tooling scaffold + smoke test

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `.gitignore`
- Create: `index.html`
- Create: `tests/dashboard.spec.js`

**Interfaces:**
- Produces: a working `npx playwright test` command, a static server on `http://localhost:4173`, and `index.html` with `<title>Chevron Color Palette</title>` — later tasks build on top of this file and this test file.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "chevron-color-palette",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  }
}
```

- [ ] **Step 2: Create `playwright.config.js`**

```js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
/test-results/
/playwright-report/
```

- [ ] **Step 4: Install dependencies**

Run: `npm install && npx playwright install --with-deps chromium`
Expected: installs succeed with no errors.

- [ ] **Step 5: Write the failing smoke test**

`tests/dashboard.spec.js`:

```js
const { test, expect } = require('@playwright/test');

test('page loads with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Chevron Color Palette');
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx playwright test`
Expected: FAIL (no `index.html` exists yet, so the server 404s or the title is empty).

- [ ] **Step 7: Create minimal `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Chevron Color Palette</title>
</head>
<body>
</body>
</html>
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx playwright test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add package.json playwright.config.js .gitignore index.html tests/dashboard.spec.js
git commit -m "Add Playwright tooling scaffold and smoke test"
```

---

### Task 2: Dashboard rendering, error handling, and responsive layout

**Files:**
- Modify: `index.html`
- Create: `assets/css/style.css`
- Create: `assets/js/app.js`
- Create: `tests/fixtures/chevrons.json`
- Modify: `tests/dashboard.spec.js`
- Create: `data/chevrons.json` (production seed data)
- Create: `images/chevron-sunrise-ridge.svg`, `images/chevron-harbor-mist.svg` (production seed images)

**Interfaces:**
- Consumes: `index.html` and `tests/dashboard.spec.js` from Task 1.
- Produces (DOM contract later tasks/tests rely on): grid container `#chevron-grid.chevron-grid`; each chevron renders as `article.chevron-card[data-id]` containing `img.chevron-image` (gets class `chevron-image--broken` on load error) and `div.swatch-strip` containing one `div.swatch[data-id]` per color, each with `span.swatch-color` (background-color = hex) and `span.swatch-code` (text = code). No data → `p.empty-state` with text `"No chevrons yet."`. Fetch/parse failure → `p.empty-state` with text `"Unable to load chevron data."`.

- [ ] **Step 1: Create the test fixture**

`tests/fixtures/chevrons.json`:

```json
[
  {
    "id": "chevron-001",
    "name": "Sunset Ridge",
    "image": "images/chevron-001.png",
    "colors": [
      { "id": "chevron-001-color-1", "hex": "#E4572E", "code": "RAL 2001" },
      { "id": "chevron-001-color-2", "hex": "#F3A712", "code": "RAL 1028" }
    ]
  },
  {
    "id": "chevron-002",
    "name": "Morning Fog",
    "image": "images/chevron-002.png",
    "colors": [
      { "id": "chevron-002-color-1", "hex": "#8D99AE", "code": "RAL 7042" }
    ]
  },
  {
    "id": "chevron-003",
    "name": "Deep Forest",
    "image": "images/chevron-003.png",
    "colors": [
      { "id": "chevron-003-color-1", "hex": "#2B4739", "code": "RAL 6009" },
      { "id": "chevron-003-color-2", "hex": "#5C8374", "code": "RAL 6021" },
      { "id": "chevron-003-color-3", "hex": "#A9C5A0", "code": "RAL 6019" }
    ]
  }
]
```

- [ ] **Step 2: Write the failing rendering test**

Append to `tests/dashboard.spec.js` (add the require at the top of the file):

```js
const fixtureChevrons = require('./fixtures/chevrons.json');

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
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx playwright test`
Expected: FAIL (`#chevron-grid` doesn't exist yet, no `.chevron-card` elements).

- [ ] **Step 4: Implement `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chevron Color Palette</title>
  <link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>
  <main>
    <h1>Chevron Color Palette</h1>
    <div id="chevron-grid" class="chevron-grid"></div>
  </main>
  <script type="module" src="assets/js/app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `assets/css/style.css` (base, resting-state only)**

```css
:root {
  --color-bg: #eef0ec;
  --color-surface: rgba(255, 255, 255, 0.6);
  --color-border: rgba(0, 0, 0, 0.08);
  --color-text: #2b2f2c;
  --color-text-muted: #5c6259;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

h1 {
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.chevron-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.chevron-image {
  display: block;
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: var(--color-border);
}

.swatch-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
}

.swatch {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.swatch-color {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 3rem 1rem;
}
```

- [ ] **Step 6: Create `assets/js/app.js` (happy path only, for now)**

```js
async function fetchChevrons() {
  const response = await fetch('data/chevrons.json');
  return response.json();
}

function createSwatch(color) {
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  swatch.dataset.id = color.id;

  const colorBox = document.createElement('span');
  colorBox.className = 'swatch-color';
  colorBox.style.backgroundColor = color.hex;

  const code = document.createElement('span');
  code.className = 'swatch-code';
  code.textContent = color.code;

  swatch.append(colorBox, code);
  return swatch;
}

function createCard(chevron) {
  const card = document.createElement('article');
  card.className = 'chevron-card';
  card.dataset.id = chevron.id;

  const img = document.createElement('img');
  img.className = 'chevron-image';
  img.src = chevron.image;
  img.alt = chevron.name;

  const strip = document.createElement('div');
  strip.className = 'swatch-strip';
  chevron.colors.forEach((color) => strip.appendChild(createSwatch(color)));

  card.append(img, strip);
  return card;
}

function renderChevrons(grid, chevrons) {
  grid.innerHTML = '';
  chevrons.forEach((chevron) => grid.appendChild(createCard(chevron)));
}

async function init() {
  const grid = document.getElementById('chevron-grid');
  const chevrons = await fetchChevrons();
  renderChevrons(grid, chevrons);
}

init();
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx playwright test`
Expected: PASS (smoke test and rendering test both green).

- [ ] **Step 8: Commit**

```bash
git add index.html assets/css/style.css assets/js/app.js tests/fixtures/chevrons.json tests/dashboard.spec.js
git commit -m "Render chevron cards from data/chevrons.json"
```

- [ ] **Step 9: Write the failing malformed-data test**

Append inside `test.describe('dashboard rendering', ...)` in `tests/dashboard.spec.js`:

```js
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
```

- [ ] **Step 10: Run tests to verify they fail**

Run: `npx playwright test`
Expected: FAIL on both new tests (no `.empty-state` element exists; `init()` currently throws uncaught on malformed JSON and renders nothing for an empty array).

- [ ] **Step 11: Extend `assets/js/app.js` with error/empty handling**

Add these two functions and replace `renderChevrons`/`init` in `assets/js/app.js`:

```js
function renderEmptyState(grid, message) {
  grid.innerHTML = '';
  const empty = document.createElement('p');
  empty.className = 'empty-state';
  empty.textContent = message;
  grid.appendChild(empty);
}

function renderChevrons(grid, chevrons) {
  grid.innerHTML = '';
  if (!Array.isArray(chevrons) || chevrons.length === 0) {
    renderEmptyState(grid, 'No chevrons yet.');
    return;
  }
  chevrons.forEach((chevron) => grid.appendChild(createCard(chevron)));
}

async function init() {
  const grid = document.getElementById('chevron-grid');
  try {
    const chevrons = await fetchChevrons();
    renderChevrons(grid, chevrons);
  } catch (err) {
    renderEmptyState(grid, 'Unable to load chevron data.');
  }
}

init();
```

- [ ] **Step 12: Run tests to verify they pass**

Run: `npx playwright test`
Expected: PASS (all tests so far green).

- [ ] **Step 13: Commit**

```bash
git add assets/js/app.js tests/dashboard.spec.js
git commit -m "Handle malformed and empty chevron data gracefully"
```

- [ ] **Step 14: Write the failing broken-image test**

Append inside `test.describe('dashboard rendering', ...)`:

```js
  test('shows a placeholder when a chevron image fails to load', async ({ page }) => {
    const broken = { ...fixtureChevrons[0], image: 'images/does-not-exist.png' };
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify([broken]) })
    );
    await page.goto('/');
    await expect(page.locator('.chevron-image')).toHaveClass(/chevron-image--broken/);
  });
```

- [ ] **Step 15: Run test to verify it fails**

Run: `npx playwright test`
Expected: FAIL (no error listener on the image, class never added).

- [ ] **Step 16: Extend `createCard` in `assets/js/app.js`**

Replace the `img` creation block inside `createCard`:

```js
  const img = document.createElement('img');
  img.className = 'chevron-image';
  img.src = chevron.image;
  img.alt = chevron.name;
  img.addEventListener('error', () => {
    img.classList.add('chevron-image--broken');
    img.alt = `${chevron.name} (image unavailable)`;
  });
```

- [ ] **Step 17: Add the broken-image style to `assets/css/style.css`**

Append:

```css
.chevron-image--broken {
  object-fit: none;
  background: var(--color-border)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E")
    center/48px no-repeat;
}
```

- [ ] **Step 18: Run tests to verify they pass**

Run: `npx playwright test`
Expected: PASS (all tests green).

- [ ] **Step 19: Commit**

```bash
git add assets/js/app.js assets/css/style.css
git commit -m "Show a placeholder for chevron images that fail to load"
```

- [ ] **Step 20: Write the failing responsive-layout test**

Append inside `test.describe('dashboard rendering', ...)`:

```js
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
```

- [ ] **Step 21: Run test to verify it fails**

Run: `npx playwright test`
Expected: FAIL (`.chevron-grid` has no `display: grid` yet, so `gridTemplateColumns` is `"none"` at both sizes and the counts are equal).

- [ ] **Step 22: Add the grid rule to `assets/css/style.css`**

Append:

```css
.chevron-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

.chevron-card {
  margin-bottom: 0;
}
```

(The second rule removes the margin-bottom stacking hack from Step 5, now that the grid's `gap` handles spacing.)

- [ ] **Step 23: Run tests to verify they pass**

Run: `npx playwright test`
Expected: PASS (all tests green).

- [ ] **Step 24: Commit**

```bash
git add assets/css/style.css tests/dashboard.spec.js
git commit -m "Make the chevron grid responsive"
```

- [ ] **Step 25: Add production seed data and images**

`data/chevrons.json`:

```json
[
  {
    "id": "chevron-sunrise-ridge",
    "name": "Sunrise Ridge",
    "image": "images/chevron-sunrise-ridge.svg",
    "colors": [
      { "id": "chevron-sunrise-ridge-color-1", "hex": "#E4572E", "code": "RAL 2001" },
      { "id": "chevron-sunrise-ridge-color-2", "hex": "#F3A712", "code": "RAL 1028" }
    ]
  },
  {
    "id": "chevron-harbor-mist",
    "name": "Harbor Mist",
    "image": "images/chevron-harbor-mist.svg",
    "colors": [
      { "id": "chevron-harbor-mist-color-1", "hex": "#8D99AE", "code": "RAL 7042" },
      { "id": "chevron-harbor-mist-color-2", "hex": "#2B4739", "code": "RAL 6009" }
    ]
  }
]
```

`images/chevron-sunrise-ridge.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160">
  <rect width="320" height="160" fill="#F3A712" />
  <polygon points="0,0 160,80 0,160 60,160 220,80 60,0" fill="#E4572E" />
</svg>
```

`images/chevron-harbor-mist.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160">
  <rect width="320" height="160" fill="#8D99AE" />
  <polygon points="0,0 160,80 0,160 60,160 220,80 60,0" fill="#2B4739" />
</svg>
```

- [ ] **Step 26: Manually verify the seed data renders**

Run: `python3 -m http.server 4173` (from repo root), then open `http://localhost:4173` in a browser.
Expected: two cards, "Sunrise Ridge" and "Harbor Mist", each with their two color swatches and codes visible. Stop the server after checking.

- [ ] **Step 27: Commit**

```bash
git add data/chevrons.json images/chevron-sunrise-ridge.svg images/chevron-harbor-mist.svg
git commit -m "Add production seed data for two chevrons"
```

---

### Task 3: "Liquid Glass" hover state

**Files:**
- Modify: `assets/css/style.css`
- Modify: `tests/dashboard.spec.js`

**Interfaces:**
- Consumes: `.chevron-card` and `.swatch-color` from Task 2's DOM contract.

- [ ] **Step 1: Write the failing hover test**

Append inside `test.describe('dashboard rendering', ...)`:

```js
  test('increases blur and lift on hover', async ({ page }) => {
    await page.route('**/data/chevrons.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixtureChevrons) })
    );
    await page.goto('/');

    const card = page.locator('.chevron-card').first();
    const restingBlur = await card.evaluate((el) => getComputedStyle(el).backdropFilter);

    await card.hover();
    const hoverBlur = await card.evaluate((el) => getComputedStyle(el).backdropFilter);

    expect(hoverBlur).not.toBe(restingBlur);
    expect(hoverBlur).toContain('blur');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test`
Expected: FAIL (`backdrop-filter` is unset at rest and on hover, so `restingBlur === hoverBlur === 'none'`).

- [ ] **Step 3: Add hover styles to `assets/css/style.css`**

Append:

```css
.chevron-card {
  backdrop-filter: blur(0px);
  transform: translateY(0) scale(1);
  transition:
    backdrop-filter 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.chevron-card:hover,
.chevron-card:focus-within {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  transform: translateY(-4px) scale(1.02);
}

.chevron-card:hover .swatch-color,
.chevron-card:focus-within .swatch-color {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test`
Expected: PASS (full suite green).

- [ ] **Step 5: Commit**

```bash
git add assets/css/style.css tests/dashboard.spec.js
git commit -m "Add liquid-glass hover state to chevron cards"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture/file layout (Tasks 1–2), data model (Task 2 Step 1/25), dashboard rendering + resting style (Task 2), hover "Liquid Glass" state (Task 3), error handling for malformed JSON and broken images (Task 2 Steps 9–19), testing requirements — rendering, hover, responsiveness, missing-image/malformed-data (Tasks 2–3), "adding a chevron" is a manual file edit (Task 2 Step 25 demonstrates it), out-of-scope items (no upload/token/API code anywhere in this plan) — all covered.
- **Placeholder scan:** No TBDs; every step has literal code or an exact shell command.
- **Type/name consistency:** `.chevron-grid`, `.chevron-card`, `.chevron-image`, `.chevron-image--broken`, `.swatch-strip`, `.swatch`, `.swatch-color`, `.swatch-code`, `.empty-state`, `#chevron-grid` are used identically across Tasks 2 and 3. `fetchChevrons`, `createSwatch`, `createCard`, `renderChevrons`, `renderEmptyState`, `init` are the only functions defined, each introduced once and only extended afterward — no name drift.
