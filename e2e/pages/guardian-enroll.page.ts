import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Guardian enrollment (mocks: enroll, enroll-household, enroll-child, enroll-review): one link per program. */
export class GuardianEnrollPage extends BasePage {
  async open(slug: string): Promise<void> {
    await super.open(`/g/enroll/${slug}`);
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get footer(): Locator {
    return this.page.getByRole('contentinfo');
  }

  get language(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }

  text(content: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(content, options);
  }

  /** One option of "Who is applying?" (L2-071). */
  applyingAs(label: string): Locator {
    return this.page.getByRole('group', { name: 'Who is applying?' }).getByRole('radio', { name: label });
  }

  async applyAs(label: string): Promise<void> {
    await this.applyingAs(label).check();
  }

  /** The young person's details: theirs when applying for themselves, or the one a referrer refers. */
  async fillYoungPerson(values: { firstName: string; lastName: string; dateOfBirth: string; reason: string }): Promise<void> {
    await this.page.getByLabel('First name', { exact: true }).fill(values.firstName);
    await this.page.getByLabel('Last name', { exact: true }).fill(values.lastName);
    await this.page.getByLabel('Date of birth', { exact: true }).fill(values.dateOfBirth);
    await this.page.getByLabel(/^Why are you/).fill(values.reason);
  }

  /** The agreement on the review step, by its wording. */
  async agree(name: RegExp): Promise<void> {
    await this.page.getByRole('switch', { name }).check();
  }

  field(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  fieldError(id: string): Locator {
    return this.page.getByTestId(`${id}-error`);
  }

  primary(name: string | RegExp): Locator {
    return this.page.getByRole('button', { name });
  }

  async verify(contact: string, code: string): Promise<void> {
    await this.page.getByLabel('Your mobile number or email').fill(contact);
    await this.page.getByRole('button', { name: 'Send me a code' }).click();
    await this.page.getByLabel('Six-digit code').fill(code);
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async next(name = 'Continue'): Promise<void> {
    await this.page.getByRole('button', { name, exact: true }).click();
  }

  async fillChild(index: number, values: { firstName: string; lastName: string; dateOfBirth: string; allergies?: string }): Promise<void> {
    const child = this.page.getByRole('group', { name: `Child ${index + 1}` });
    await child.getByLabel('First name').fill(values.firstName);
    await child.getByLabel('Last name').fill(values.lastName);
    await child.getByLabel('Date of birth').fill(values.dateOfBirth);
    if (values.allergies) await child.getByLabel('Allergies').fill(values.allergies);
  }

  async consent(): Promise<void> {
    await this.page.getByRole('switch', { name: /season consent/ }).check();
  }

  /** A field of a child's card, by the card's name ("Child 1", "Niño 1") and the field's label. */
  childField(group: string, label: string): Locator {
    return this.page.getByRole('group', { name: group }).getByLabel(label, { exact: true });
  }
}
