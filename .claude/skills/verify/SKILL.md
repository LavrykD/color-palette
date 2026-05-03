---
name: verify
description: Run the full validation suite (format check + all tests) to confirm changes are CI-ready. Use before committing or opening a PR.
disable-model-invocation: false
---

Run the full verification suite to confirm changes will pass CI:

1. Run `npm run format:check` to verify formatting is clean. If it fails, run `npm run format` to fix, then re-check.
2. Run `npm test` to execute all Playwright tests. Report which tests passed, failed, or were skipped.
3. If any step fails, clearly describe what failed and suggest the fix.
4. Summarize the result: "Ready to commit" if everything passed, or "Needs fixes" with a list of issues.
