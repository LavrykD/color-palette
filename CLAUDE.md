# CLAUDE.md

## Commands

```bash
npm test                      # Run all tests
npm run test:ui               # Run UI tests only
npm run test:api              # Run API tests only
npm run test:headed           # Run with visible browser
npm run report                # Open HTML test report
npm run format                # Format all files with Prettier
npm run format:check          # Check formatting without writing (runs in CI)
npm run lint                  # Run ESLint
npm run lint:fix              # Run ESLint with auto-fix
npx playwright install --with-deps  # Required before first test run (installs browsers)
```

Run a single test file: `npx playwright test tests/path/to/test.spec.ts`
Run a single test by name: `npx playwright test -g "test name"`

## Architecture

Page Object Model pattern with TypeScript path aliases:

```
src/
  pages/       # Page Object classes (@pages/*)
  components/  # Reusable UI component helpers (@components/*)
  steps/       # BDD-style step definitions (@steps/*)
  fixtures/    # Playwright fixture extensions (@fixtures/*)
  utils/       # Shared helpers and utilities (@utils/*)
tests/         # Test specs
  ui/          # UI tests (run with npm run test:ui)
  api/         # API tests (run with npm run test:api)
```

Always use path aliases for imports (e.g., `import { LoginPage } from '@pages/LoginPage'`), never relative paths across top-level src directories.

## Environment Variables

Required for tests to run against a real environment:

```
BASE_URL        # Target application URL
API_URL         # API base URL
USER_EMAIL      # Test user credentials
USER_PASSWORD   # Test user credentials
```

Set these in a `.env` file locally (gitignored). In CI they come from GitHub secrets.

## Code Style

Prettier is configured with: single quotes, semicolons, trailing commas, 100-char print width, 2-space indent.

The pre-commit hook (Husky + lint-staged) auto-formats `.ts`, `.json`, and `.md` files on every commit — no need to run `npm run format` manually. CI enforces `npm run format:check` before running tests; formatting must be clean for CI to pass.

CI does **not** run `npm run lint` — linting is local-only. Lint failures won't block PRs.

`eslint.config.js` is intentionally excluded from ESLint linting — it uses CJS `require()` which conflicts with `@typescript-eslint/no-require-imports`. Do not remove it from the ignores list.

## Test Configuration

- Browsers: Chromium, Firefox, WebKit (all run by default)
- Retries: 0 locally, 2 in CI
- Workers: parallel locally, 1 in CI
- `module` type: `commonjs` — use `require`/`exports` syntax if writing plain JS files
