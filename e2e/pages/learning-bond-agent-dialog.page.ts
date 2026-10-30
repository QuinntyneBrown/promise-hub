import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The Ask dialog over a guardian Learning Bond page (mock: learning-bond-ask): the household's conversation and one question. */
export class LearningBondAgentDialogPage extends BasePage {
  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  /** The agent's opening line while the conversation is empty. */
  get opening(): Locator {
    return this.dialog.getByTestId('agent-text');
  }

  /** The conversation, labelled with the dialog's title. */
  thread(label: string): Locator {
    return this.dialog.getByRole('list', { name: label });
  }

  /** Each message's words, oldest first. */
  messages(label: string): Locator {
    return this.thread(label).getByRole('listitem').locator('.bubble');
  }

  /** Who wrote each message, oldest first. */
  authors(label: string): Locator {
    return this.thread(label).getByRole('listitem').locator('.meta');
  }

  async openFrom(askLabel: string): Promise<void> {
    await this.page.getByRole('button', { name: askLabel }).click();
    await expect(this.dialog).toBeVisible();
  }

  async ask(label: string, question: string, send: string): Promise<void> {
    await this.dialog.getByRole('textbox', { name: label }).fill(question);
    await this.dialog.getByRole('button', { name: send }).click();
  }
}
