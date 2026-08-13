# Chevron Color Palette Dashboard — Design Spec

Date: 2026-08-13

## Purpose

A static dashboard, hosted on GitHub Pages only, that displays chevron images
alongside the color palette used on each one (color swatch + paint/reference
code). Visitors with a properly scoped GitHub token can upload new chevrons
(image + a variable-length list of colors), which commits the new data
directly to this repository.

## Constraints

- GitHub Pages only — no server, no build step, no backend of any kind.
- Data must be visible to all visitors (not per-browser), so it lives in the
  repo itself and is served as static JSON.
- Uploads must go through a real git commit (via GitHub REST API), not
  browser-local storage.
- Token handling must be as safe as a purely static, client-side app can make
  it: never leaked, never persisted anywhere but the visitor's own browser.

## Architecture

Plain HTML/CSS/JS, no framework, no build step. Two pages, one shared data
file, three small JS modules.

```
index.html                  — dashboard: grid of chevron+palette cards
upload.html                 — admin tool: add a new chevron entry
/assets/css/style.css       — glass styling, layout, typography
/assets/js/app.js           — fetches data/chevrons.json, renders cards
/assets/js/upload.js        — upload form logic (dynamic color rows, submit handler)
/assets/js/github-api.js    — thin wrapper around the GitHub Contents API
/data/chevrons.json         — [{ id, name, image, colors: [{ hex, code }] }]
/images/<slug>.<ext>        — uploaded chevron images
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
      { "hex": "#E4572E", "code": "RAL 2001" },
      { "hex": "#F3A712", "code": "RAL 1028" }
    ]
  }
]
```

`id` is a slug generated from the name + timestamp to avoid collisions.
`colors` length is unbounded — the UI renders however many are present.

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

## Upload (upload.html)

Treated as an admin tool, not a prominent nav item on the public dashboard.

1. **Token gate**: on first use, prompt for a GitHub fine-grained personal
   access token, scoped to only this repository with only the `Contents:
   Read and write` permission. Store it in `localStorage` under a clearly
   named key. Show a persistent "clear saved token" control. Display a short
   note recommending the token be given an expiration (fine-grained PATs cap
   at 1 year) and rotated periodically — a GitHub platform limit, not
   something the app can change.
2. **Form fields**: chevron name, image file picker, repeatable color rows
   (native color input + text code input), add/remove-row buttons. At least
   one color row required.
3. **Submit flow** (`github-api.js`, using `api.github.com` over HTTPS only —
   no third-party relay, token never sent anywhere else):
   - Read the image file, base64-encode it.
   - `PUT /repos/{owner}/{repo}/contents/images/{slug}.{ext}` to create the
     image file.
   - On success, `GET /repos/{owner}/{repo}/contents/data/chevrons.json` for
     current content + `sha`.
   - Append the new entry, `PUT` the updated JSON back with that `sha`.
   - On success, optimistically render the new card in the current page
     immediately, with a note that the live site will reflect it once GitHub
     Pages finishes its rebuild (~30–60s).
4. **Token safety in code**: the token is read from `localStorage` at request
   time, attached only to the `Authorization` header of requests to
   `api.github.com`, and never written into any commit, log line, thrown
   error message, or third-party call.

## Error handling

- Missing/invalid token: validated (a lightweight authenticated `GET` to the
  repo) before any write attempt; clear inline error, no partial writes.
- Image `PUT` fails: stop before touching `chevrons.json` — never leave a
  palette entry pointing at a missing image.
- `chevrons.json` `PUT` conflicts (409, stale `sha` because something else
  committed in between): re-fetch the file, re-apply the new entry, retry
  once; if it fails again, surface a "please retry" message rather than
  overwriting silently.
- Network/API errors: shown inline near the form, original form values
  preserved so the user doesn't lose input.

## Testing

No test framework — this is a small static site. Verification is manual:

- Serve locally (`python3 -m http.server` or equivalent) to check dashboard
  layout, card resting/hover states, and responsiveness across a couple of
  viewport widths.
- Run a full end-to-end upload against a scratch/test repository first (not
  this repo) to confirm the commit flow, error paths (bad token, sha
  conflict), and optimistic rendering all behave before trusting it against
  the real repo.

## Out of scope

- Editing or deleting existing chevron entries (upload/create only, for now).
- Multi-user auth beyond "whoever holds a valid token for this repo."
- Build tooling, linting, or CI (none of the previous project's tooling is
  being restored).
