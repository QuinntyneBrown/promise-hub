import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The progression framework (mock: curriculum-progression): stages in order, their competencies, and the stage and competency dialogs. */
export class CurriculumProgressionPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/curriculum/progression');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Progression framework' })).toBeVisible();
  }

  /** The stage cards' titles, such as "1. Explorer". */
  async stageTitles(): Promise<string[]> {
    return (await this.page.getByRole('heading', { level: 2, name: /^\d+\. / }).allInnerTexts()).map((t) => t.trim());
  }

  stage(name: string): Locator {
    return this.page.getByRole('region', { name: new RegExp(`^\\d+\\. ${name}$`) });
  }

  async competencies(stage: string): Promise<string[]> {
    return (
      await this.page
        .getByRole('list', { name: `Competencies of ${stage}` })
        .getByTestId('list-title')
        .allInnerTexts()
    ).map((t) => t.trim());
  }

  get howYouthAdvance(): Locator {
    return this.page.getByRole('region', { name: 'How youth advance' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async addStage(name: string, description = ''): Promise<void> {
    await this.page.getByRole('button', { name: 'Add stage' }).first().click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Stage name').fill(name);
    await this.dialog.getByLabel('Short description').fill(description);
    await this.dialog.getByRole('button', { name: 'Add stage' }).click();
  }

  async editStage(stage: string, name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Edit ${stage}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Stage name').fill(name);
    await this.dialog.getByRole('button', { name: 'Save stage' }).click();
  }

  moveUp(stage: string): Locator {
    return this.page.getByRole('button', { name: `Move ${stage} up` });
  }

  moveDown(stage: string): Locator {
    return this.page.getByRole('button', { name: `Move ${stage} down` });
  }

  async addCompetency(stage: string, name: string, description = ''): Promise<void> {
    await this.page.getByRole('button', { name: `Add competency to ${stage}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel('Competency', { exact: true }).fill(name);
    await this.dialog.getByLabel('What it looks like').fill(description);
    await this.dialog.getByRole('button', { name: 'Add competency' }).click();
  }

  async removeCompetency(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove ${name}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Remove competency' }).click();
  }

  dialogError(id: string): Locator {
    return this.dialog.getByTestId(`${id}-error`);
  }

  get dialogAlert(): Locator {
    return this.dialog.getByRole('alert');
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get noStages(): Locator {
    return this.page.getByRole('heading', { name: 'No stages yet' });
  }

  get errorState(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load the progression framework' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Program directors write the curriculum' });
  }

  async apiStatus(path: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }

  async apiPutStatus(path: string, body: object): Promise<number> {
    return this.page.evaluate(
      async ([p, b]) => (await fetch(p as string, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })).status,
      [path, body] as const,
    );
  }
}
