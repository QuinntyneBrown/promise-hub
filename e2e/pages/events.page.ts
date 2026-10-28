import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Events (mock: events), an event (mock: event) and the event form (mock: event-form), with the cancel dialog. */
export class EventsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/events');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Events' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get details(): Locator {
    return this.page.getByRole('region', { name: 'Details' });
  }

  get slipCard(): Locator {
    return this.page.getByRole('region', { name: 'Permission slip' });
  }

  get cancelledNotice(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'This event is cancelled' });
  }

  async names(): Promise<string[]> {
    return (await this.list.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  row(name: string): Locator {
    return this.list.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async filter(name: 'Upcoming' | 'Needs slips' | 'Past'): Promise<void> {
    await this.page.getByRole('group', { name: 'Filter events' }).getByRole('button', { name }).click();
  }

  async openEvent(name: string): Promise<void> {
    await this.list.getByRole('link', { name: new RegExp(`^${name}`) }).first().click();
    await expect(this.heading).toHaveText(name);
  }

  async fillEvent(values: { name: string; program: string; startsAt: string; endsAt: string; place?: string; slip: boolean }): Promise<void> {
    await this.page.getByLabel('Event name').fill(values.name);
    await this.page.getByLabel('Program').selectOption({ label: values.program });
    await this.page.getByLabel('Starts').fill(values.startsAt);
    await this.page.getByLabel('Ends').fill(values.endsAt);
    await this.page.getByLabel('Where').fill(values.place ?? '');
    await this.page.getByRole('radio', { name: values.slip ? /^Required/ : /^Not needed/ }).check();
  }

  get repeatWeekly(): Locator {
    return this.page.getByRole('switch', { name: 'Repeat weekly' });
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  async submitEvent(label = 'Create event'): Promise<void> {
    await this.page.getByRole('button', { name: label }).click();
  }

  async cancel(message: string): Promise<void> {
    await this.page.getByRole('button', { name: 'More actions' }).click();
    await this.dialog.getByRole('menuitem', { name: 'Cancel event…' }).click();
    await expect(this.page.getByRole('dialog', { name: /^Cancel / })).toBeVisible();
    await this.dialog.getByLabel('Message to guardians').fill(message);
    await this.dialog.getByRole('button', { name: /^Cancel event/ }).click();
    await expect(this.dialog).toBeHidden();
  }
}
