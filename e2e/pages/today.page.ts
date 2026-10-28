import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Today, the staff home (mock: today): sessions, counts, slips due, coming up and work waiting. */
export class TodayPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/');
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'Nothing here yet' });
  }

  /** A participant's Today with no module serving their role (mock: today/youth-learning-off). */
  get nothingToDo(): Locator {
    return this.page.getByRole('heading', { name: 'Nothing to do here yet' });
  }

  /** The titles in a participant's "Your work" card. */
  async yourWork(): Promise<string[]> {
    return (await this.card('Your work').getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  session(name: string): Locator {
    return this.page.getByRole('region', { name });
  }

  emptyStateAction(name: string): Locator {
    return this.page.getByRole('link', { name });
  }

  stat(label: string): Locator {
    return this.page.getByRole('region', { name: 'At a glance' }).getByText(label).locator('..').getByTestId('stat-value');
  }

  card(title: string): Locator {
    return this.page.getByRole('region', { name: title });
  }

  item(card: string, title: string): Locator {
    return this.card(card).getByRole('listitem').filter({ hasText: title });
  }

  async follow(card: string, name: string): Promise<void> {
    await this.card(card).getByRole('link', { name: new RegExp(name) }).click();
  }

  /** A volunteer's card for a session he is assigned to today (mock: today/volunteer). */
  volunteerSession(name: string): Locator {
    return this.page.getByRole('region', { name, exact: true });
  }

  async takeAttendance(session: string): Promise<void> {
    await this.volunteerSession(session).getByRole('link', { name: 'Take attendance' }).click();
  }

  /** A volunteer with no session today (mock: today/volunteer-empty). */
  get noSessionToday(): Locator {
    return this.page.getByRole('heading', { name: 'No session today' });
  }

  /** A volunteer's sessions failed to load (mock: today/volunteer-error). */
  get sessionFailed(): Locator {
    return this.page.getByRole('heading', { name: 'Your session didn’t load' });
  }

  async tryAgain(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  get loading(): Locator {
    return this.page.locator('[aria-busy="true"]');
  }
}
