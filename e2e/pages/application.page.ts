import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** One application (mock: application) with the add-application-note, place-applicant and decide-application dialogs. */
export class ApplicationPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/applications/${id}`);
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  card(title: 'Young person' | 'Referral' | 'Application' | 'Family' | 'Notes'): Locator {
    return this.page.getByRole('region', { name: title });
  }

  fact(key: string): Locator {
    return this.page.getByTestId(`fact-${key}`);
  }

  get notes(): Locator {
    return this.page.getByRole('list', { name: 'Staff notes' }).getByRole('listitem');
  }

  get outcome(): Locator {
    return this.page.getByTestId('application-outcome');
  }

  action(name: 'Place' | 'Waitlist' | 'Decline'): Locator {
    return this.page.getByRole('main').getByRole('button', { name: new RegExp(`^${name}`) });
  }

  async addNote(text: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Add note' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Note').fill(text);
    await this.dialog.getByRole('button', { name: 'Add note' }).click();
  }

  async closeDialog(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(this.dialog).toBeHidden();
  }
}
