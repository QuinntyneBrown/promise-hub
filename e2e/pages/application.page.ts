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

  cohort(name: string): Locator {
    return this.dialog.getByRole('radio', { name: new RegExp(`^${name}`) });
  }

  get inviteSwitch(): Locator {
    return this.dialog.getByRole('switch', { name: /^Invite .* as a youth$/ }).or(this.dialog.getByRole('checkbox', { name: /^Invite .* as a youth$/ }));
  }

  async openPlace(): Promise<void> {
    await this.action('Place').click();
    await expect(this.dialog).toBeVisible();
  }

  async place(options: { cohort?: string; invite?: string | false; note?: string } = {}): Promise<void> {
    if (options.cohort) await this.cohort(options.cohort).check();
    if (options.invite === false) await this.inviteSwitch.uncheck();
    else if (options.invite !== undefined) {
      await this.inviteSwitch.check();
      await this.dialog.getByRole('textbox', { name: /’s email$/ }).fill(options.invite);
    }
    if (options.note !== undefined) await this.dialog.getByLabel(/^Note to the family/).fill(options.note);
    await this.dialog.getByRole('button', { name: /^Place and text / }).click();
  }

  async decide(action: 'Waitlist' | 'Decline', note?: string): Promise<void> {
    await this.action(action).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('radio', { name: new RegExp(`^${action}`) }).check();
    if (note !== undefined) await this.dialog.getByRole('textbox').fill(note);
    await this.dialog.getByRole('button', { name: /^(Waitlist|Decline) and text / }).click();
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
