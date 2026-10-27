import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A badge as a program director fills in the builder. */
export interface BadgeInput {
  name?: string;
  description?: string;
  icon?: string;
  kind?: 'Automatically, by a rule' | 'By hand';
  rule?: 'Completes a lesson' | 'Completes a module' | 'Passes a quiz' | 'Has an assignment accepted';
  target?: string;
  competency?: string;
}

/** Badges and the badge builder (mock: curriculum-badge): the list, a new or existing badge, who earned it and Award badge. */
export class CurriculumBadgePage extends BasePage {
  async openList(): Promise<void> {
    await super.open('/curriculum/badges');
  }

  async openNew(): Promise<void> {
    await super.open('/curriculum/badges/new');
  }

  async openBadge(id: string): Promise<void> {
    await super.open(`/curriculum/badges/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(
      this.page.getByRole('heading', {
        level: 1,
        name: new RegExp(`^${title}`),
      }),
    ).toBeVisible();
  }

  get badges(): Locator {
    return this.page.getByRole('list', { name: 'Badges' });
  }

  async badgeNames(): Promise<string[]> {
    return (await this.badges.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  async badgeMetas(): Promise<string[]> {
    return (await this.badges.getByTestId('list-meta').allInnerTexts()).map((t) => t.trim());
  }

  kpi(name: 'badges' | 'awarded' | 'most-earned'): Locator {
    return this.page.getByTestId(`kpi-${name}`);
  }

  async choose(name: string): Promise<void> {
    await this.badges.getByRole('link', { name: new RegExp(`^${name}\\b`) }).click();
  }

  async newBadge(): Promise<void> {
    await this.page.getByRole('link', { name: 'New badge' }).first().click();
  }

  get noBadges(): Locator {
    return this.page.getByRole('heading', { name: 'No badges yet' });
  }

  async fill(b: BadgeInput): Promise<void> {
    if (b.name !== undefined) await this.page.getByLabel('Badge name').fill(b.name);
    if (b.description !== undefined) await this.page.getByLabel('What it celebrates').fill(b.description);
    if (b.icon) await this.page.getByLabel('Icon').selectOption({ label: b.icon });
    if (b.kind)
      await this.page
        .getByRole('group', { name: 'How it’s earned' })
        .getByRole('radio', { name: new RegExp(`^${b.kind}`) })
        .check();
    if (b.rule) await this.page.getByLabel('Rule', { exact: true }).selectOption({ label: b.rule });
    if (b.target) await this.page.getByLabel('Which one').selectOption({ label: b.target });
    if (b.competency) await this.page.getByLabel('Counts toward').selectOption({ label: b.competency });
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save badge' }).click();
  }

  get name(): Locator {
    return this.page.getByLabel('Badge name');
  }

  get preview(): Locator {
    return this.page.getByTestId('badge-preview');
  }

  get earnedBy(): Locator {
    return this.page.getByRole('list', { name: 'Youth who earned it' });
  }

  get earnedByTitle(): Locator {
    return this.page.getByRole('heading', { name: /^Earned by/ });
  }

  get awardButton(): Locator {
    return this.page.getByRole('button', { name: 'Award badge' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async delete(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Delete ${name}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Delete badge' }).click();
  }

  async award(youth: string): Promise<void> {
    await this.awardButton.click();
    await expect(this.dialog).toBeVisible();
    if (youth) await this.dialog.getByLabel('Youth').selectOption({ label: youth });
    await this.dialog.getByRole('button', { name: 'Award badge' }).click();
  }

  dialogError(id: string): Locator {
    return this.dialog.getByTestId(`${id}-error`);
  }

  get dialogAlert(): Locator {
    return this.dialog.getByRole('alert');
  }

  fieldError(id: string): Locator {
    return this.page.getByTestId(`${id}-error`);
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  get failedAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'We couldn’t save the badge' });
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that badge' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', {
      name: 'Program directors write the curriculum',
    });
  }

  get errorState(): Locator {
    return this.page.getByRole('heading', {
      name: 'We couldn’t load the badges',
    });
  }

  async apiStatus(path: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }
}
