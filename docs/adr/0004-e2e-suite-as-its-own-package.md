# 0004: The e2e suite is its own npm package with a fake API

- Status: accepted
- Date: 2026-10-25

## Context

Playwright specs in `e2e/` cannot resolve packages from `frontend/node_modules`. The suite must pass with no backend running.

## Decision

`e2e/` has its own `package.json` (Playwright, axe, TypeScript) with `playwright-core` pinned through `overrides` so axe and Playwright share one version. `fixtures/fake-api.ts` answers every `/api` call from `fixtures/seed.ts`; any other request, or an `/api` route it does not know, fails the test. Playwright's `webServer` starts only the Angular dev server, on port 4317.

## Consequences

CI installs both packages. Every API change updates the fake in the same change.
