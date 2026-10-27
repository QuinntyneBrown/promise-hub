import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

export type QuestionKind = 'Multiple choice' | 'True / false' | 'Multiple answer' | 'Short answer';

/** A question as an author writes it in the quiz-question dialog. */
export interface QuestionInput {
  text: string;
  type: QuestionKind;
  /** Option texts for multiple choice and multiple answer. */
  options?: string[];
  /** Letters of the correct options (A, B…), or True / False. */
  correct?: string[];
  /** Accepted answers for short answer, one per line. */
  answers?: string;
}

/** The quiz builder (mock: curriculum-quiz): questions in order, settings and status. */
export class CurriculumQuizPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/curriculum/quizzes/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: new RegExp(`^${title}`) })).toBeVisible();
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get status(): Locator {
    return this.page.getByTestId('quiz-status');
  }

  get questions(): Locator {
    return this.page.getByRole('list', { name: 'Questions, in order' });
  }

  async questionTitles(): Promise<string[]> {
    return (await this.questions.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  async questionMetas(): Promise<string[]> {
    return (await this.questions.getByTestId('list-meta').allInnerTexts()).map((t) => t.trim());
  }

  get noQuestions(): Locator {
    return this.page.getByRole('heading', { name: 'No questions yet' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async addQuestion(q: QuestionInput): Promise<void> {
    await this.page.getByRole('button', { name: 'Add question' }).first().click();
    await expect(this.dialog).toBeVisible();
    await this.fillQuestion(q);
    await this.dialog.getByRole('button', { name: 'Add question' }).click();
  }

  async editQuestion(number: number, q: Partial<QuestionInput>): Promise<void> {
    await this.page.getByRole('button', { name: `Edit question ${number}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.fillQuestion(q);
    await this.dialog.getByRole('button', { name: 'Save question' }).click();
  }

  async deleteQuestion(number: number): Promise<void> {
    await this.page.getByRole('button', { name: `Delete question ${number}` }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Delete question' }).click();
  }

  moveUp(number: number): Locator {
    return this.page.getByRole('button', { name: `Move question ${number} up` });
  }

  moveDown(number: number): Locator {
    return this.page.getByRole('button', { name: `Move question ${number} down` });
  }

  private async fillQuestion(q: Partial<QuestionInput>): Promise<void> {
    if (q.type) await this.dialog.getByLabel('Question type').selectOption({ label: q.type });
    if (q.text !== undefined) await this.dialog.getByLabel('Question', { exact: true }).fill(q.text);
    const letters = 'ABCDEF';
    for (const [i, text] of (q.options ?? []).entries()) {
      const field = this.dialog.getByLabel(`Option ${letters[i]}`, { exact: true });
      if (!(await field.count())) await this.dialog.getByRole('button', { name: 'Add option' }).click();
      await this.dialog.getByLabel(`Option ${letters[i]}`, { exact: true }).fill(text);
    }
    if (q.answers !== undefined) await this.dialog.getByLabel('Accepted answers').fill(q.answers);
    for (const mark of q.correct ?? []) {
      const choice = this.dialog.getByRole(q.type === 'Multiple answer' ? 'checkbox' : 'radio', { name: new RegExp(`^${mark}\\b`) });
      await choice.check();
    }
  }

  dialogError(id: string): Locator {
    return this.dialog.getByTestId(`${id}-error`);
  }

  groupError(name: string): Locator {
    return this.dialog.getByRole('group', { name }).locator('.error');
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that quiz' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Program directors write the curriculum' });
  }

  get errorState(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load this quiz' });
  }

  async apiStatus(path: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }
}
