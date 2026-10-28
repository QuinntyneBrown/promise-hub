import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface AssignWorkEntry {
  kind?: 'Lesson' | 'Quiz' | 'Assignment';
  /** The item's option label, "title · module". */
  item?: string;
  who?: 'A whole cohort' | 'Youth I choose';
  /** The cohort's option label, "name · n youth". */
  cohort?: string;
  youth?: string[];
  due?: string;
  message?: string;
}

/** The Assign work dialog (mock: assign-work), opened from the mentor dashboard. */
export class AssignWorkDialog extends BasePage {
  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Assign work' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.dialog).toHaveCount(0);
  }

  async fill(entry: AssignWorkEntry): Promise<void> {
    const d = this.dialog;
    if (entry.kind) await d.getByRole('group', { name: 'What are you assigning?' }).getByLabel(entry.kind).check();
    if (entry.item !== undefined) await this.item(entry.kind ?? 'Lesson').selectOption({ label: entry.item });
    if (entry.who) await d.getByRole('group', { name: 'Who is it for?' }).getByLabel(entry.who).check();
    if (entry.cohort !== undefined) await d.getByRole('combobox', { name: 'Cohort' }).selectOption({ label: entry.cohort });
    for (const name of entry.youth ?? []) await this.youth(name).check();
    if (entry.due !== undefined) await d.getByLabel('Due date').fill(entry.due);
    if (entry.message !== undefined) await d.getByLabel('Message').fill(entry.message);
  }

  /** The item list, labelled by the kind chosen. */
  item(kind: 'Lesson' | 'Quiz' | 'Assignment' = 'Lesson'): Locator {
    return this.dialog.getByRole('combobox', { name: kind, exact: true });
  }

  youth(name: string): Locator {
    return this.dialog.getByRole('group', { name: 'Your youth' }).getByRole('checkbox', { name: new RegExp(`^${name}`) });
  }

  get cohort(): Locator {
    return this.dialog.getByRole('combobox', { name: 'Cohort' });
  }

  async assign(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Assign', exact: true }).click();
  }

  async cancel(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cancel' }).click();
  }

  get summary(): Locator {
    return this.dialog.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get failed(): Locator {
    return this.dialog.getByText('That didn’t go through');
  }

  get nothingToAssign(): Locator {
    return this.dialog.getByRole('heading', { name: 'Nothing to assign yet' });
  }

  error(text: string): Locator {
    return this.dialog.getByText(text, { exact: true });
  }

  field(label: string): Locator {
    return this.dialog.getByLabel(label);
  }

  /** Calls the API directly, as a mentor would without the dialog, and answers the HTTP status. */
  async apiStatus(path = '/api/mentoring/assign-work'): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }

  async assignStatus(body: Record<string, unknown>): Promise<number> {
    return this.page.evaluate(
      async (b) => (await fetch('/api/mentoring/assigned-work', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })).status,
      body,
    );
  }
}
