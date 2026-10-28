import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface RaiseFlagEntry {
  youth?: string;
  severity?: 'Low' | 'Medium' | 'High';
  reason?: string;
}

/** The Raise an at-risk flag dialog (mock: raise-flag), opened from At-risk flags. */
export class RaiseFlagDialog extends BasePage {
  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Raise an at-risk flag' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async fill(entry: RaiseFlagEntry): Promise<void> {
    const d = this.dialog;
    if (entry.youth !== undefined) await d.getByLabel('Youth', { exact: true }).selectOption({ label: entry.youth });
    if (entry.severity) await d.getByRole('group', { name: 'How serious is it?' }).getByLabel(entry.severity).check();
    if (entry.reason !== undefined) await d.getByLabel('Why are you worried?').fill(entry.reason);
  }

  async save(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Raise flag' }).click();
  }

  get summary(): Locator {
    return this.dialog.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get failed(): Locator {
    return this.dialog.getByText('That didn’t go through');
  }

  alreadyFlagged(youth: string): Locator {
    return this.dialog.getByText(`${youth} already has an open flag`);
  }

  get hint(): Locator {
    return this.dialog.getByText('Don’t wait for a flag: tell your program director now.');
  }

  field(label: string): Locator {
    return this.dialog.getByLabel(label);
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () =>
        (
          await fetch('/api/mentoring/flags', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              childId: 'c-mateo',
              severity: 'Low',
              reason: 'Quiet lately.',
            }),
          })
        ).status,
    );
  }
}
