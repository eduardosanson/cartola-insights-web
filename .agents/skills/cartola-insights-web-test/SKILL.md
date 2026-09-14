---
name: cartola-insights-web-test
description: Use when validating cartola-insights-web tests, lint, coverage, pre-commit checks, or PR readiness.
---

# Cartola Insights Web Test

## Overview

Run the frontend validation suite that catches lint and test regressions before commits and PRs.

## Commands

From the repository root:

```bash
npm run lint
npm run coverage
```

## Expected Result

- `npm run lint` exits 0 with no oxlint errors.
- `npm run coverage` exits 0 with all Vitest tests passing and coverage report generated.

## If It Fails

Invoke `superpowers:systematic-debugging` before proposing fixes. Do not commit while this skill fails.
