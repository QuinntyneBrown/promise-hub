import { defineConfig, devices } from '@playwright/test';

const port = 4317;
// The performance budgets (L2-033) are measured on the production build, served on its own port.
const budgetPort = 4318;
const budgets = /performance-budgets\.spec\.ts/;

// Chromium only. The backend is faked in fixtures/; webServer starts only the frontend.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    // Scrolling is smooth by design; reduced motion makes it instant so axe never checks a page mid-scroll.
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    { name: 'desktop', testIgnore: budgets, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', testIgnore: budgets, use: { ...devices['Pixel 7'] } },
    { name: 'budgets', testMatch: budgets, use: { ...devices['Pixel 7'], baseURL: `http://localhost:${budgetPort}` } },
  ],
  webServer: [
    {
      command: `npm --prefix ../frontend run start -- --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
    {
      command: `npm --prefix ../frontend run start -- --configuration production --port ${budgetPort}`,
      url: `http://localhost:${budgetPort}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 300_000,
    },
  ],
});
