import type { Locator } from '@playwright/test';
import { SitePage } from './site.page';

/** Get involved at /site/{slug}/get-involved (mock: site-get-involved), with the volunteer-interest and start-donation dialogs. */
export class SiteGetInvolvedPage extends SitePage {
  protected readonly path = 'get-involved';

  get ways(): Locator {
    return this.page.getByRole('main').getByRole('heading', { level: 2 });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async openVolunteer(): Promise<void> {
    await this.page.getByRole('button', { name: 'Sign up to volunteer' }).click();
  }

  async fillVolunteer(offer: {
    name?: string;
    email?: string;
    phone?: string;
    area?: string;
    about?: string;
    acknowledge?: boolean;
  }): Promise<void> {
    const d = this.dialog;
    if (offer.name !== undefined) await d.getByLabel('Your name').fill(offer.name);
    if (offer.email !== undefined) await d.getByLabel('Email', { exact: true }).fill(offer.email);
    if (offer.phone !== undefined) await d.getByLabel('Phone').fill(offer.phone);
    if (offer.area !== undefined) await d.getByLabel('How would you like to help?').selectOption(offer.area);
    if (offer.about !== undefined) await d.getByLabel('A bit about you').fill(offer.about);
    if (offer.acknowledge !== undefined) await d.getByRole('checkbox').setChecked(offer.acknowledge);
  }

  async signUp(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Sign up', exact: true }).click();
  }

  async openDonation(): Promise<void> {
    await this.page.getByRole('button', { name: 'Donate' }).click();
  }

  async fillDonation(gift: { amount?: '$20' | '$50' | '$100'; name?: string; email?: string }): Promise<void> {
    const d = this.dialog;
    if (gift.amount) await d.getByRole('radio', { name: new RegExp(`^\\${gift.amount} a month`) }).check();
    if (gift.name !== undefined) await d.getByLabel('Your name').fill(gift.name);
    if (gift.email !== undefined) await d.getByLabel('Email for your receipt').fill(gift.email);
  }

  async continueToPayment(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Continue to payment' }).click();
  }

  get openPayment(): Locator {
    return this.dialog.getByRole('link', { name: 'Open secure payment' });
  }

  /** A message in the dialog, such as an error or the thank-you. */
  dialogText(text: string): Locator {
    return this.dialog.getByText(text);
  }

  dialogError(id: string): Locator {
    return this.dialog.locator(`#${id}-error`);
  }

  get toast(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Thanks for offering to help' });
  }
}
