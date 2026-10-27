import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Your progress: Overview, Quizzes and Attendance tabs (mock: learn-progress). */
export class LearnProgressPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/learning/progress');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Your progress' })).toBeVisible();
  }

  /** The value of a number on the open tab, by its label. */
  stat(label: string): Locator {
    return this.page.getByRole('tabpanel').locator('ph-stat').filter({ hasText: label }).getByTestId('stat-value');
  }

  tab(name: string): Locator {
    return this.page.getByRole('tablist', { name: 'Your progress' }).getByRole('tab', { name });
  }

  async openTab(name: string): Promise<void> {
    await this.tab(name).click();
  }

  get panel(): Locator {
    return this.page.getByRole('tabpanel');
  }

  /** A competency row, by its name. */
  competency(name: string): Locator {
    return this.page
      .getByRole('list', { name: 'Your competencies' })
      .getByRole('listitem')
      .filter({
        has: this.page.getByTestId('list-title').filter({ hasText: new RegExp(`^${name}$`) }),
      });
  }

  /** A table row on the open tab, by text it contains. */
  row(text: string): Locator {
    return this.panel.getByRole('row').filter({ hasText: text });
  }

  get startALesson(): Locator {
    return this.page.getByRole('link', { name: 'Start a lesson' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', {
      name: 'We couldn’t load your progress',
    });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/learning/progress')).status);
  }
}
