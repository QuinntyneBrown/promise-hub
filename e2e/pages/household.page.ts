import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A household (mock: household) with its dialogs: add child, add guardian, edit guardian, actions and delete. */
export class HouseholdPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get children(): Locator {
    return this.page.getByRole('list', { name: 'Children' });
  }

  get guardians(): Locator {
    return this.page.getByRole('list', { name: 'Guardians' });
  }

  get restrictedNotice(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Some details are hidden for your role' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async openHousehold(householdId: string): Promise<void> {
    await super.open(`/families/${householdId}`);
  }

  /** The Learning Bond card (mock: household, state learning-bond-not-invited): status only, never a SIN or an amount. */
  get learningBond(): Locator {
    return this.page.getByTestId('learning-bond-card');
  }

  async inviteToLearningBond(): Promise<void> {
    await this.learningBond.getByRole('button', { name: 'Invite to Learning Bond' }).click();
  }

  /** The Invite the {name} household to Learning Bond dialog (mock: learning-bond-invite-household). */
  get inviteDialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Invite the .* household to Learning Bond$/ });
  }

  async sendInvitation(): Promise<void> {
    await this.inviteDialog.getByRole('button', { name: 'Send invitation' }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  async expectOpen(name: string): Promise<void> {
    await expect(this.heading).toHaveText(`${name} household`);
  }

  async childNames(): Promise<string[]> {
    return (await this.children.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  guardian(name: string): Locator {
    return this.guardians.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  flags(): Locator {
    return this.children.getByTestId('medical-flag');
  }

  async openChild(name: string): Promise<void> {
    await this.children.getByRole('link', { name: new RegExp(`^${name}`) }).click();
  }

  async addChild(values: { name: string; dateOfBirth: string; school?: string; allergies?: string }): Promise<void> {
    await this.page.getByRole('button', { name: 'Add child' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Child’s name').fill(values.name);
    await this.dialog.getByLabel('Date of birth').fill(values.dateOfBirth);
    await this.dialog.getByLabel('School and grade (optional)').fill(values.school ?? '');
    await this.dialog.getByLabel('Allergies and medical (optional)').fill(values.allergies ?? '');
    await this.dialog.getByRole('button', { name: 'Add child' }).click();
  }

  async editGuardian(name: string, values: { mobile?: string; canPickUp?: boolean }): Promise<void> {
    await this.guardian(name)
      .getByRole('button', { name: `Edit ${name}` })
      .click();
    await expect(this.dialog).toBeVisible();
    if (values.mobile !== undefined) await this.dialog.getByLabel('Mobile').fill(values.mobile);
    if (values.canPickUp !== undefined) await this.dialog.getByRole('switch', { name: 'Approved to pick up' }).setChecked(values.canPickUp);
    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).toBeHidden();
  }

  async openActions(): Promise<void> {
    await this.page.getByRole('button', { name: 'More actions' }).click();
    await expect(this.dialog).toBeVisible();
  }

  async startDelete(): Promise<void> {
    await this.openActions();
    await this.dialog.getByRole('menuitem', { name: 'Delete household…' }).click();
    await expect(this.page.getByRole('dialog', { name: /^Delete the .* household\?$/ })).toBeVisible();
  }

  get deleteConfirmButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Delete in 30 days' });
  }

  async typeConfirmation(text: string): Promise<void> {
    await this.dialog.getByLabel('Type the household name to confirm').fill(text);
  }
}
