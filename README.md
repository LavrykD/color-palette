# Chevron Color Palette

A static dashboard of chevron images and the color palette used on each one.
Plain HTML/CSS/JS, no framework, no build step, hosted on GitHub Pages.

Live site: https://lavrykd.github.io/color-palette/

## Adding a chevron

There is no upload form — chevrons are added by editing files directly and
pushing a commit.

1. Add the image to `images/<slug>.<ext>`.
2. Add an entry to `data/chevrons.json`:

   ```json
   {
     "id": "chevron-<slug>",
     "name": "Display Name",
     "image": "images/<slug>.<ext>",
     "colors": [
       { "id": "chevron-<slug>-color-1", "hex": "#RRGGBB", "code": "RAL 1234" }
     ]
   }
   ```

3. Commit and push. `colors` can be any length; each color gets its own
   `id` following the `<chevron-id>-color-<n>` pattern.

## Development

```bash
npm install
npx playwright install --with-deps chromium
npx playwright test
```

Tests serve the site locally via `python3 -m http.server` (configured in
`playwright.config.js`) and intercept `data/chevrons.json` with fixture
data — no real chevron data is touched by the test suite.
