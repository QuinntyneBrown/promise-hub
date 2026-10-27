import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A module of a youth's track: progress, anchor and lessons in order (mock: learn-module). */
export class LearnModulePage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/learning/modules/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  /** A lesson row, by its title. */
  lesson(title: string): Locator {
    return this.page.getByRole('listitem').filter({
      has: this.page.getByTestId('list-title').filter({ hasText: new RegExp(`^\\d+\\. ${title}$`) }),
    });
  }

  lessonLink(title: string): Locator {
    return this.page.getByRole('link', {
      name: new RegExp(`^\\d+\\. ${title}`),
    });
  }

  async openLesson(title: string): Promise<void> {
    await this.lessonLink(title).click();
  }

  get anchor(): Locator {
    return this.page.getByRole('blockquote');
  }

  /** The locked state: “Finish … first”. */
  locked(prerequisite: string): Locator {
    return this.page.getByRole('heading', {
      name: `Finish ${prerequisite} first`,
    });
  }

  get continueButton(): Locator {
    return this.page.getByRole('link', { name: /^Continue: / });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', {
      name: 'We can’t find that module',
    });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(async (m) => (await fetch(`/api/learning/modules/${m}`)).status, id);
  }
}
