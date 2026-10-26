import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import { BasePage } from '../../pages/base.page';
import { CheckInPage } from '../../pages/check-in.page';
import { EventsPage } from '../../pages/events.page';
import { FamiliesPage } from '../../pages/families.page';
import { ReportsPage } from '../../pages/reports.page';
import { TodayPage } from '../../pages/today.page';

// L2-033 performance budgets, measured on the CI runner against the fake API.
test.describe('Meet the performance budgets', () => {
  // One page at a time, so the measurement is of the page and not of other tests competing for the runner.
  test.describe.configure({ mode: 'serial' });

  const screens: [string, (page: Page) => BasePage & { open(): Promise<void> }][] = [
    ['Today', (page) => new TodayPage(page)],
    ['Check-in', (page) => new CheckInPage(page)],
    ['Families', (page) => new FamiliesPage(page)],
    ['Events', (page) => new EventsPage(page)],
    ['Reports', (page) => new ReportsPage(page)],
  ];

  for (const [name, make] of screens) {
    test(`Given ${name} loaded cold, then it paints within 1.5 s and is interactive within 2.5 s`, async ({ page }) => {
      const screen = make(page);
      await screen.open();

      const timings = await screen.loadTimings();

      expect(timings.firstContentfulPaint).toBeLessThan(1500);
      expect(timings.interactive).toBeLessThan(2500);
    });
  }

  test('Given tonight’s roster, when a child is checked in, then the row updates within 300 ms', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.heading).toHaveText('Tutoring night');

    const elapsed = await checkIn.timeCheckIn('Jordan Thompson');

    expect(elapsed).toBeLessThan(300);
  });

  test('Given tonight’s roster, when a name is typed, then each keystroke filters within 200 ms', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.heading).toHaveText('Tutoring night');

    const perKeystroke = await checkIn.timeSearch('Rivera');

    expect(Math.max(...perKeystroke)).toBeLessThan(200);
    expect(await checkIn.names()).toEqual(['Mateo Rivera', 'Sofía Rivera']);
  });
});
