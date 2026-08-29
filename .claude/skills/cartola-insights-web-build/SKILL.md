---
name: cartola-insights-web-build
description: Use when building cartola-insights-web, checking TypeScript, production bundles, pre-commit checks, or PR readiness.
---

# Cartola Insights Web Build

## Overview

Run the production build path for the frontend, including TypeScript project references and Vite bundling.

## Command

From the repository root:

```bash
npm run build
```

## Expected Result

- TypeScript (`tsc -b`) exits 0.
- Vite production build exits 0 and writes `dist/`.

## If It Fails

Invoke `superpowers:systematic-debugging` before proposing fixes. Do not commit while this skill fails.
