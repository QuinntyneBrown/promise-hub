import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The assignment builder (mock: curriculum-assignment): details, rubric, due rules and status. */
export class CurriculumAssignmentPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/curriculum/assignments/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: new RegExp(`^${title}`) })).toBeVisible();
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get status(): Locator {
    return this.page.getByTestId('assignment-status');
  }

  get title(): Locator {
    return this.page.getByLabel('Assignment title');
  }

  get attachedTo(): Locator {
    return this.page.getByLabel('Attached to');
  }

  get brief(): Locator {
    return this.page.getByLabel('Task');
  }

  way(label: 'Text reflection' | 'Photo' | 'Link' | 'File upload'): Locator {
    return this.page.getByRole('group', { name: 'Ways to submit' }).getByRole('checkbox', { name: label });
  }

  get waysError(): Locator {
    return this.page.getByRole('group', { name: 'Ways to submit' }).locator('.error');
  }

  get dueDate(): Locator {
    return this.page.getByLabel(/^Due date/);
  }

  get grace(): Locator {
    return this.page.getByLabel('Grace period');
  }

  get allowLate(): Locator {
    return this.page.getByRole('switch', { name: 'Allow late submissions' });
  }

  get approval(): Locator {
    return this.page.getByRole('switch', { name: 'Mentor approves before it counts as complete' });
  }

  get rubric(): Locator {
    return this.page.getByRole('list', { name: 'Rubric criteria' });
  }

  async criteria(): Promise<string[]> {
    return (await this.rubric.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  get total(): Locator {
    return this.page.getByTestId('rubric-total');
  }

  get noCriteria(): Locator {
    return this.page.getByRole('heading', { name: 'No criteria yet' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async addCriterion(description: string, points: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Add criterion' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Criterion').fill(description);
    await this.dialog.getByLabel('Points').fill(points);
    await this.dialog.getByRole('button', { name: 'Add criterion' }).click();
  }

  async editCriterion(number: number, description: string, points: string): Promise<void> {
    await this.page.getByRole('button', { name: `Edit criterion ${number}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Criterion').fill(description);
    await this.dialog.getByLabel('Points').fill(points);
    await this.dialog.getByRole('button', { name: 'Save criterion' }).click();
  }

  async removeCriterion(number: number): Promise<void> {
    await this.page.getByRole('button', { name: `Remove criterion ${number}` }).click();
  }

  dialogError(id: string): Locator {
    return this.dialog.getByTestId(`${id}-error`);
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save assignment' }).click();
  }

  fieldError(id: string): Locator {
    return this.page.getByTestId(`${id}-error`);
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get failedAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'We couldn’t save the assignment' });
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  async changeStatus(status: 'Draft' | 'Published'): Promise<void> {
    await this.page.getByRole('button', { name: /^Status of / }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('radio', { name: new RegExp(`^${status}`) }).check();
    await this.dialog.getByRole('button', { name: 'Save status' }).click();
  }

  get statusError(): Locator {
    return this.dialog.getByRole('group', { name: 'Status' }).locator('.error');
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that assignment' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Program directors write the curriculum' });
  }

  get errorState(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load this assignment' });
  }

  async apiStatus(path: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }
}
