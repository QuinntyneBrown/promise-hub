# Frontend scaffold

Scaffold only. Overwrite or delete as implementation requires. No product logic is implemented.

The app renders a blank router outlet. All 16 libraries are registered Angular projects with empty public APIs or route tables. No UI components, design tokens, feature screens, API services, guards or tests are implemented.

Run `npm ci`, `npm start`, `npm run check`. Prettier owns formatting; angular-eslint checks TypeScript and accessible templates. `npm run build:all` compiles every library and the application.

JSON configuration and the generated lockfile cannot contain comments; this notice covers them too. Keep working tooling as needed; replace or delete placeholders when implementing.

The Vite override uses patch 8.3.5 to address advisories in Angular build's pinned 8.3.0. Revisit it when upgrading Angular tooling.

There are intentionally no test targets until behavior tests are introduced. Future browser tests must use Chromium only. The root Husky pre-commit hook runs frontend formatting and lint, then backend formatting. Install from this folder to enable hooks. Set `HUSKY=0` in CI. Generated `.husky/_/` files are ignored.
