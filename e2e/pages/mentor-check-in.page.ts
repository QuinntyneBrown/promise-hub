import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface MentorCheckInEntry {
  youth?: string;
  date?: string;
  kind?: '1:1' | 'Call' | 'Session';
  went?: 'Struggling' | 'Low' | 'Steady' | 'Engaged' | 'Thriving';
  topics?: string;
  actionItems?: string;
  privateNotes?: string;
  followUp?: string;
  share?: boolean;
  guardianInformed?: boolean;
}

/** The Log a mentor check-in dialog (mock: mentor-check-in), opened from the history or a youth’s record. */
export class MentorCheckInDialog extends BasePage {
  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Log a mentor check-in' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  get youth(): Locator {
    return this.dialog.getByLabel('Youth', { exact: true });
  }

  /** The youth named in the dialog when it was opened from her record. */
  fixedYouth(name: string): Locator {
    return this.dialog.getByRole('definition').filter({ hasText: name });
  }

  async fill(entry: MentorCheckInEntry): Promise<void> {
    const d = this.dialog;
    if (entry.youth !== undefined) await this.youth.selectOption({ label: entry.youth });
    if (entry.date !== undefined) await d.getByLabel('Date', { exact: true }).fill(entry.date);
    if (entry.kind) await d.getByRole('group', { name: 'How you met' }).getByLabel(entry.kind, { exact: true }).check();
    if (entry.went) await d.getByRole('group', { name: 'How it went' }).getByLabel(entry.went).check();
    if (entry.topics !== undefined) await d.getByLabel('What you talked about').fill(entry.topics);
    if (entry.actionItems !== undefined) await d.getByLabel('Action items').fill(entry.actionItems);
    if (entry.privateNotes !== undefined) await d.getByLabel('Private notes').fill(entry.privateNotes);
    if (entry.followUp !== undefined) await d.getByLabel('Next follow-up').fill(entry.followUp);
    if (entry.share) await d.getByRole('switch', { name: 'Share with the youth and guardian' }).check();
    if (entry.guardianInformed) await d.getByLabel('Guardian was informed').check();
  }

  async save(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Save check-in' }).click();
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

  field(label: string): Locator {
    return this.dialog.getByLabel(label);
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () =>
        (
          await fetch('/api/mentoring/check-ins', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ childId: 'c-mateo', date: '2026-11-05', kind: 'OneToOne', engagement: 'Steady' }),
          })
        ).status,
    );
  }
}
