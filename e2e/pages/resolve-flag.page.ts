import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export type FlagOutcomeLabel = 'Reconnected, back on track' | 'Handed to the program director' | 'Left the program' | 'Flagged in error';

/** The Resolve this flag? dialog (mock: resolve-flag), opened from a flag on At-risk flags. */
export class ResolveFlagDialog extends BasePage {
  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Resolve this flag?' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async fill(outcome?: FlagOutcomeLabel, note?: string): Promise<void> {
    if (outcome) await this.dialog.getByRole('group', { name: 'How was it resolved?' }).getByLabel(outcome).check();
    if (note !== undefined) await this.dialog.getByLabel('Note').fill(note);
  }

  async save(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Resolve flag' }).click();
  }

  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cancel' }).click();
  }

  get summary(): Locator {
    return this.dialog.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get alreadyResolved(): Locator {
    return this.dialog.getByText('This flag is already resolved');
  }

  get failed(): Locator {
    return this.dialog.getByText('That didn’t go through');
  }

  fact(text: string): Locator {
    return this.dialog.getByRole('definition').filter({ hasText: text });
  }
}
