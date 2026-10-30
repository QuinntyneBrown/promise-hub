import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A guardian's Learning Bond page from the invitation link (mock: guardian-learning-bond), with the device code step first when needed. */
export class GuardianLearningBondPage extends BasePage {
  async openLink(token: string): Promise<void> {
    await super.open(`/g/learning-bond/${token}`);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The agent's line, read with its speaker. */
  get agent(): Locator {
    return this.page.getByTestId('agent-text');
  }

  get children(): Locator {
    return this.page.getByTestId('learning-bond-children');
  }

  child(firstName: string): Locator {
    return this.children.getByRole('listitem').filter({ hasText: firstName });
  }

  /** Sends the code to the contact, then enters it (L2-026). */
  async verify(contact: string, code: string): Promise<void> {
    await this.page.getByRole('textbox').first().fill(contact);
    await this.page.getByRole('button', { name: /^(Send the code|Enviar el código|Envoyer le code)$/ }).click();
    await this.page.getByRole('textbox').first().fill(code);
    await this.page.getByRole('button', { name: /^(Continue|Continuar|Continuer)$/ }).click();
  }

  async continue(): Promise<void> {
    await this.page.getByRole('link', { name: /^(Continue|Continuar|Continuer)$/ }).click();
  }

  async choose(label: string): Promise<void> {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  get confirmation(): Locator {
    return this.page.getByTestId('learning-bond-choice');
  }

  /** The consent step (mock: learning-bond-consent): one box per child with the exact wording, the typed name and Agree. */
  consentBox(firstName: string): Locator {
    return this.page.getByRole('checkbox', { name: new RegExp(`^I agree that Learning Bond may collect ${firstName}’s`) });
  }

  async sign(name: string): Promise<void> {
    await this.page.getByLabel('Type your full name to sign').fill(name);
    await this.page.getByRole('button', { name: 'Agree', exact: true }).click();
  }

  fieldError(field: 'children' | 'typed-name'): Locator {
    return this.page.getByTestId(`consent-${field}-error`);
  }

  get consentRecorded(): Locator {
    return this.page.getByTestId('consent-recorded');
  }

  async openIntake(token: string, childId: string): Promise<void> {
    await super.open(`/g/learning-bond/${token}/children/${childId}/intake`);
  }

  /** The record to confirm on the intake: the child's name and date of birth. */
  get record(): Locator {
    return this.page.getByTestId('intake-record');
  }

  sinField(label: 'Your SIN' | string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  /** A SIN already given, shown only as its last three digits. */
  masked(name: 'guardian' | 'child'): Locator {
    return this.page.getByTestId(`intake-${name}-sin-saved`);
  }

  async answerTaxes(answer: 'Yes' | 'No' | 'Not sure'): Promise<void> {
    await this.page.getByRole('radio', { name: answer, exact: true }).check();
  }

  async saveIntake(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save and continue' }).click();
  }

  intakeError(field: 'guardian-sin' | 'child-sin'): Locator {
    return this.page.getByTestId(`intake-${field}-error`);
  }

  get intakeSaved(): Locator {
    return this.page.getByTestId('intake-saved');
  }

  async openEstimate(token: string, childId: string): Promise<void> {
    await super.open(`/g/learning-bond/${token}/children/${childId}/estimate`);
  }

  get estimateNote(): Locator {
    return this.page.getByTestId('estimate-note');
  }

  async openReview(token: string, childId: string): Promise<void> {
    await super.open(`/g/learning-bond/${token}/children/${childId}/review`);
  }

  get provider(): Locator {
    return this.page.getByTestId('review-provider');
  }

  /** One field of the application under review, such as "Phone". */
  reviewField(label: string): Locator {
    return this.page.getByTestId('review-fields').getByRole('listitem').filter({ hasText: label });
  }

  async editField(label: string, value: string): Promise<void> {
    await this.page.getByRole('button', { name: `Edit ${label}` }).click();
    await this.page.getByRole('dialog').getByLabel(label, { exact: true }).fill(value);
    await this.page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  }

  async chooseProvider(name: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Choose another' }).click();
    await this.page.getByRole('dialog').getByRole('radio', { name }).check();
    await this.page.getByRole('dialog').getByRole('button', { name: 'Use this provider' }).click();
  }

  submitButton(provider: string): Locator {
    return this.page.getByRole('button', { name: `Submit to ${provider}` });
  }

  get sent(): Locator {
    return this.page.getByTestId('review-sent');
  }

  get canadaLink(): Locator {
    return this.page.getByRole('link', { name: /canada\.ca/ });
  }

  get notSent(): Locator {
    return this.page.getByTestId('review-not-sent');
  }

  /** Where the claim is: Consent, Your details, Estimate, Review and submit, Sent. */
  get stepper(): Locator {
    return this.page.getByTestId('stepper');
  }

  async openSubmitted(token: string, childId: string): Promise<void> {
    await super.open(`/g/learning-bond/${token}/children/${childId}/submitted`);
  }

  /** What happens next: the three steps, each with its marker. */
  get nextSteps(): Locator {
    return this.page.getByTestId('next-steps').getByRole('listitem');
  }

  /** What the provider last reported: received, deposited or a document needed. */
  get progressNotice(): Locator {
    return this.page.getByTestId('progress-notice');
  }

  /** Chooses a file for the requested document; it is kept, not sent. */
  async chooseDocument(name: string, mimeType: string, size = 1200): Promise<void> {
    await this.page
      .getByTestId('document-request')
      .locator('input[type=file]')
      .setInputFiles({ name, mimeType, buffer: Buffer.alloc(size, 37) });
  }

  get documentRequest(): Locator {
    return this.page.getByTestId('document-request');
  }

  get documentSent(): Locator {
    return this.page.getByTestId('document-sent');
  }

  get depositWindow(): Locator {
    return this.page.getByTestId('deposit-window');
  }

  /** One field of what was sent, such as "Mateo’s SIN". */
  sentField(label: string): Locator {
    return this.page.getByTestId('sent-fields').getByRole('listitem').filter({ hasText: label });
  }

  async openPaused(token: string, childId: string): Promise<void> {
    await super.open(`/g/learning-bond/${token}/children/${childId}/paused`);
  }

  get pausedBadge(): Locator {
    return this.page.getByTestId('paused-badge');
  }

  async remind(answer: 'Yes, text me' | 'No thanks'): Promise<void> {
    await this.page.getByRole('radio', { name: answer }).check();
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  get reminderSaved(): Locator {
    return this.page.getByTestId('reminder-saved');
  }

  async expectCodeStep(): Promise<void> {
    await expect(this.heading).toHaveText(/^(Check it’s you|Confirme que es usted|Confirmez que c’est vous)$/);
  }
}
