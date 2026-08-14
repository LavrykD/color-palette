# Chevron Color Palette Dashboard — Design Spec

Date: 2026-08-13 (revised 2026-08-14: dropped upload flow, static-only)

## Purpose

A static dashboard, hosted on GitHub Pages only, that displays chevron images
alongside the color palette used on each one (color swatch + paint/reference
code). All data is static and file-based: new chevrons are added by directly
editing the repository's data files (image + JSON entry) and committing —
there is no in-app upload, no visitor-facing write path, and no database of
any kind.

## Constraints

- GitHub Pages only — no server, no build step, no backend of any kind.
- Data lives in the repo itself and is served as static JSON — no database.
- Adding, editing, or removing chevrons happens by editing files in this repo
  directly (by the maintainer, from code) and pushing a commit. The deployed
  site has no write capability whatsoever — no token, no API calls, no
  client-side persistence standing in for real data.

## Architecture

Plain HTML/CSS/JS, no framework, no build step. One page, one shared data
file, one small JS module.

```
index.html                  — dashboard: grid of chevron+palette cards
/assets/css/style.css       — glass styling, layout, typography
/assets/js/app.js           — fetches data/chevrons.json, renders cards
/data/chevrons.json         — [{ id, name, image, colors: [{ hex, code }] }]
/images/<slug>.<ext>        — chevron images
```

### Data model

`data/chevrons.json`:

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
  }
]
```

`id` (chevron-level) is a slug, unique per chevron. Each color also gets its
own `id` — `<chevron-id>-color-<n>` — so an individual color within a
chevron's palette can be referenced or linked to directly, independent of its
hex/code. `colors` length is unbounded — the UI renders however many are
present.

## Adding a chevron

Done by hand, from code, by the maintainer only:

1. Add the image file to `/images/<slug>.<ext>`.
2. Add a new object to `data/chevrons.json`, following the existing ID
   convention (`<chevron-id>-color-<n>` for each color row).
3. Commit and push.

No in-app form, no script, no tooling — this is a plain file edit.

## Dashboard (index.html)

- Responsive CSS grid of cards, one per chevron.
- Each card is a single unit: chevron image on top, swatch strip below (each
  swatch = color square + its paint/reference code as small text), inside one
  visual container.
- Background: a single muted, softly-toned surface (warm neutral / soft
  slate-sage tone) with very subtle depth — not a busy multi-stop gradient,
  not stark black or white.
- Typography: modern geometric sans stack (`Inter`/system-ui fallback chain),
  clear at small sizes for color codes.
- Card resting state: flat, understated — thin border, faint shadow, no blur.
- Card hover state ("Liquid Glass"): backdrop-blur ramps up, translucency
  increases so background shows through, a soft specular highlight
  sweeps/appears near the top edge, subtle scale/lift transform. Swatches gain
  a slight glass sheen on hover too. Implemented with CSS transitions on
  `backdrop-filter`, `background`, `box-shadow`, `transform` — no JS required
  for the effect itself.

## Error handling

- Missing or malformed `data/chevrons.json`: fail gracefully — show an empty
  state rather than a broken page.
- A chevron entry whose `image` path 404s: render the card with visible
  alt text / placeholder rather than a broken image icon; don't let one bad
  entry break the rest of the grid.

## Testing

Playwright, as a dev-only dependency (`package.json` + `@playwright/test`) —
it never ships to the deployed static site, it only drives a local static
server during test runs.

- Serve the site locally (e.g. `python3 -m http.server` or Playwright's own
  `webServer` config) and drive it with Playwright for:
  - Dashboard rendering: cards show the right image, swatches, and codes for
    a fixture `data/chevrons.json`.
  - Hover state: assert the glass-hover styling (e.g. `backdrop-filter`/class
    change) triggers on `hover`/focus.
  - Responsiveness: run key assertions across a couple of viewport sizes.
  - Missing-image / malformed-data handling per the Error handling section.

## Out of scope

- Any in-app write path: no upload form, no GitHub API calls, no token
  handling. Adding/editing/removing chevrons is done by editing files
  directly and committing, not through the app.
- Multi-user auth of any kind — there are no visitor-facing write
  permissions to gate.
- Linting, CI, or any other tooling from the previous project (not being
  restored). `package.json` is reintroduced only as a dev dependency holder
  for Playwright — the deployed site itself remains build-free.
