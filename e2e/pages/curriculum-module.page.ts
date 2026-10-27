import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The module editor (mock: curriculum-module): details, lessons in order and visibility. */
export class CurriculumModulePage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/curriculum/modules/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(
      this.page.getByRole('heading', {
        level: 1,
        name: new RegExp(`^${title}`),
      }),
    ).toBeVisible();
    await expect(this.name).toHaveValue(title);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get name(): Locator {
    return this.page.getByLabel('Module name');
  }

  get description(): Locator {
    return this.page.getByLabel(/^Description/);
  }

  get prerequisite(): Locator {
    return this.page.getByLabel('Prerequisite');
  }

  get anchor(): Locator {
    return this.page.getByLabel(/^Anchor passage/);
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get failedAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'We couldn’t save the module' });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', {
      name: 'We can’t find that module',
    });
  }

  fieldError(id: string): Locator {
    return this.page.getByTestId(`${id}-error`);
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save module' }).click();
  }

  async backToCurriculum(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Curriculum' }).click();
  }

  get status(): Locator {
    return this.page.getByTestId('module-status');
  }

  get lessons(): Locator {
    return this.page.getByRole('list', { name: 'Lessons, in order' });
  }

  async lessonTitles(): Promise<string[]> {
    return (await this.lessons.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  get noLessons(): Locator {
    return this.page.getByRole('heading', { name: 'No lessons yet' });
  }

  moveDown(lesson: string): Locator {
    return this.page.getByRole('button', { name: `Move ${lesson} down` });
  }

  async openLesson(title: string): Promise<void> {
    await this.lessons.getByRole('link', { name: new RegExp(title) }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async addLesson(title: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Add lesson' }).first().click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Lesson title').fill(title);
    await this.dialog.getByRole('button', { name: 'Create and edit' }).click();
  }

  async changeStatus(status: 'Draft' | 'In review' | 'Published'): Promise<void> {
    await this.page.getByRole('button', { name: 'Status', exact: true }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('radio', { name: new RegExp(`^${status}`) }).check();
    await this.dialog.getByRole('button', { name: 'Save status' }).click();
  }

  get statusError(): Locator {
    return this.dialog.getByRole('group', { name: 'Status' }).locator('.error');
  }
}
