import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Programs (mock: programs), a program (mock: program) and the program form (mock: program-form), with their dialogs. */
export class ProgramsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/programs');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Programs' })).toBeVisible();
    // The list arrives after the header; reading names before it would race.
    await expect(this.list.getByRole('listitem').first().or(this.page.getByRole('heading', { level: 2 }).first())).toBeVisible();
  }

  /** Goes to Programs without waiting for it, for redirects. */
  async visitList(): Promise<void> {
    await super.open('/programs');
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get term(): Locator {
    return this.page.getByLabel('Term');
  }

  async edit(): Promise<void> {
    await this.page.getByRole('link', { name: 'Edit', exact: true }).click();
    await expect(this.heading).toHaveText('Edit program');
    await expect(this.page.getByLabel('Program name')).not.toHaveValue('');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Programs' });
  }

  get roster(): Locator {
    return this.page.getByRole('list', { name: 'Roster' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get newProgramButton(): Locator {
    return this.page.getByRole('link', { name: 'New program' });
  }

  async names(list: Locator = this.list): Promise<string[]> {
    return (await list.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  row(name: string, list: Locator = this.list): Locator {
    return list.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async filter(name: 'Active' | 'Archived'): Promise<void> {
    await this.page.getByRole('group', { name: 'Filter programs' }).getByRole('button', { name }).click();
  }

  async openProgram(name: string): Promise<void> {
    await this.list.getByRole('link', { name: new RegExp(`^${name}`) }).click();
    await expect(this.heading).toHaveText(name);
  }

  fieldError(id: string): Locator {
    return this.page.getByTestId(`${id}-error`);
  }

  async fillProgram(values: { name: string; startsOn: string; endsOn: string; schedule?: string; capacity: string; ages?: string; open?: boolean }): Promise<void> {
    await this.page.getByLabel('Program name').fill(values.name);
    await this.page.getByLabel('Starts').fill(values.startsOn);
    await this.page.getByLabel('Ends').fill(values.endsOn);
    await this.page.getByLabel('Schedule').fill(values.schedule ?? '');
    await this.page.getByLabel('Capacity').fill(values.capacity);
    await this.page.getByLabel('Ages').fill(values.ages ?? '');
    await this.page.getByRole('radio', { name: values.open ? /^Open now/ : /^Closed/ }).check();
  }

  async submitProgram(label = 'Create program'): Promise<void> {
    await this.page.getByRole('button', { name: label }).click();
  }

  async enroll(search: string, child: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Add a child' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Child’s name').fill(search);
    await this.dialog.getByRole('button', { name: `Choose ${child}` }).click();
    await this.dialog.getByRole('button', { name: 'Add to roster' }).click();
    await expect(this.dialog).toBeHidden();
  }

  async removeFromRoster(child: string): Promise<void> {
    await this.row(child, this.roster).getByRole('button', { name: `Remove ${child}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Remove from roster' }).click();
    await expect(this.dialog).toBeHidden();
  }

  async archive(name: string): Promise<void> {
    await this.page.getByRole('button', { name: 'More actions' }).click();
    await this.dialog.getByRole('menuitem', { name: 'Archive program…' }).click();
    await expect(this.page.getByRole('dialog', { name: `Archive ${name}?` })).toBeVisible();
    await this.dialog.getByLabel('Type the program name to confirm').fill(name);
    await this.dialog.getByRole('button', { name: 'Archive program' }).click();
    await expect(this.dialog).toBeHidden();
  }

  get archivedNotice(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'This program is archived' });
  }

  async openEnrollment(): Promise<void> {
    await this.page.getByRole('button', { name: 'Open enrollment' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Open enrollment' }).click();
  }

  async closeDialog(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Done' }).click();
    await expect(this.dialog).toBeHidden();
  }

  async closeEnrollment(): Promise<void> {
    await this.page.getByRole('button', { name: 'Close enrollment' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Close enrollment' }).click();
    await expect(this.dialog).toBeHidden();
  }
}
