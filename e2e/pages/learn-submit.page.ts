import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Writing and sending an assignment's work (mock: learn-submit) with the submit-assignment and unsaved-changes dialogs. */
export class LearnSubmitPage extends BasePage {
  async open(assignmentId: string): Promise<void> {
    await super.open(`/learning/assignments/${assignmentId}/submit`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  get reflection(): Locator {
    return this.page.getByLabel('Your reflection');
  }

  get link(): Locator {
    return this.page.getByLabel('Your link');
  }

  get attestation(): Locator {
    return this.page.getByRole('checkbox', { name: 'This is my own work and it reflects something I really did.' });
  }

  /** The file input inside the drop zone (Choose photo or Choose file). */
  get fileInput(): Locator {
    return this.page.getByLabel(/^Choose (photo|file)$/);
  }

  /** The chosen or kept file's row, by name. */
  chosenFile(name: string): Locator {
    return this.page.getByRole('list', { name: 'Your file' }).getByRole('listitem').filter({ hasText: name });
  }

  async write(text: string): Promise<void> {
    await this.reflection.fill(text);
  }

  async attach(name: string, mimeType: string, buffer: Buffer): Promise<void> {
    await this.fileInput.setInputFiles({ name, mimeType, buffer });
  }

  async removeFile(name: string): Promise<void> {
    await this.page.getByRole('button', { name: `Remove ${name}` }).click();
  }

  async attest(): Promise<void> {
    await this.attestation.check();
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /^(Submit|Resubmit)$/ });
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  get saveDraftButton(): Locator {
    return this.page.getByRole('button', { name: 'Save draft' });
  }

  async saveDraft(): Promise<void> {
    await this.saveDraftButton.click();
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  /** The error under a field: reflection, link, file or attest. */
  fieldError(field: 'reflection' | 'link' | 'file' | 'attest'): Locator {
    return this.page.getByTestId(`${field}-error`);
  }

  /** An alert above the form: restored draft, refused file, failed send or the mentor's note. */
  get notice(): Locator {
    return this.page.locator('ph-alert').first();
  }

  alert(title: string): Locator {
    return this.page.locator('ph-alert').filter({ hasText: title });
  }

  get startOverButton(): Locator {
    return this.page.getByRole('button', { name: 'Start over' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Send it to/ });
  }

  async confirm(): Promise<void> {
    await this.dialog.getByRole('button', { name: /^(Submit for review|Resubmit)$/ }).click();
  }

  async keepEditing(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Keep editing' }).click();
  }

  get dialogFailure(): Locator {
    return this.dialog.getByRole('alert');
  }

  get leaveDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Leave without submitting?' });
  }

  async leaveChoice(name: 'Keep editing' | 'Save draft and leave' | 'Leave without saving'): Promise<void> {
    await this.leaveDialog.getByRole('button', { name }).click();
  }

  /** The state when the work is already with the mentor, or submissions have closed. */
  stateHeading(name: 'You’ve already submitted this' | 'Submissions are closed'): Locator {
    return this.page.getByRole('heading', { name });
  }

  /** Follows the breadcrumb back to the module, as leaving the page would. */
  async leaveForModule(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Leading by Serving' }).click();
  }

  /** Reloads the tab and answers whether the browser asked before leaving. */
  async reloadAsksFirst(): Promise<boolean> {
    let asked = false;
    this.page.once('dialog', async (dialog) => {
      asked = dialog.type() === 'beforeunload';
      await dialog.accept();
    });
    await this.page.reload();
    return asked;
  }

  /** Whether a draft for this membership and assignment is kept on the device. */
  async hasDraft(membershipId: string, assignmentId: string): Promise<boolean> {
    return this.page.evaluate((key) => localStorage.getItem(key) !== null, `promisehub.draft.${membershipId}.${assignmentId}`);
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }
}
