import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The guardian's reminders and running total (mocks: learning-bond-reminders, learning-bond-total, the total card on guardian-learning-bond). */
export class GuardianRemindersPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** One reminder, by its words, such as "File your 2026 taxes". */
  reminder(title: string): Locator {
    return this.page.getByTestId('reminders').getByRole('listitem').filter({ hasText: title });
  }

  async turnOff(title: string): Promise<void> {
    await this.page.getByRole('button', { name: `Turn off ${title}` }).click();
  }

  get noReminders(): Locator {
    return this.page.getByText('No reminders');
  }

  /** The total card on the guardian page. */
  get totalCard(): Locator {
    return this.page.getByTestId('learning-bond-total');
  }

  get unlocked(): Locator {
    return this.page.getByTestId('total-unlocked');
  }

  get applied(): Locator {
    return this.page.getByTestId('total-applied');
  }

  /** One row of the total by child and stream. */
  row(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }
}
