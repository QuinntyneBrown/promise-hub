import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The guardian consent page (mock: guardian-consent) with the code check and the withdraw dialog (mock: withdraw-consent). */
export class GuardianConsentPage extends BasePage {
  async open(token: string): Promise<void> {
    await super.open(`/g/consent/${token}`);
    await expect(this.heading).toBeVisible();
    await expect(this.heading).not.toHaveText(/^(Loading|Cargando|Chargement)/);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get language(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get wording(): Locator {
    return this.page.getByTestId('consent-wording');
  }

  /** The consent record: who signed, the relationship, when and the reference. */
  get record(): Locator {
    return this.page.getByTestId('consent-record');
  }

  get callButton(): Locator {
    return this.page.getByRole('main').getByRole('link', { name: /^(Call|Llamar al|Appeler le) / });
  }

  fieldError(field: 'relationship' | 'agree' | 'name'): Locator {
    return this.page.getByTestId(`consent-${field}-error`);
  }

  text(content: string | RegExp): Locator {
    return this.page.getByText(content);
  }

  /** Verifies this device with the contact on file and the code texted to it. */
  async verify(contact: string, code: string): Promise<void> {
    await this.page.getByRole('textbox', { name: /(Your mobile number or email|Su número de celular o correo|Votre numéro de cellulaire ou courriel)/ }).fill(contact);
    await this.page.getByRole('button', { name: /^(Send me a code|Envíenme un código|Envoyez-moi un code)$/ }).click();
    await this.page.getByRole('textbox', { name: /(Six-digit code|Código de seis dígitos|Code à six chiffres)/ }).fill(code);
    await this.page.getByRole('button', { name: /^(Continue|Continuar|Continuer)$/ }).click();
    await expect(this.wording.or(this.record)).toBeVisible();
  }

  /** Chooses the relationship, ticks the box (unless told not to) and signs with a typed name. */
  async consent(relationship: string, name: string, agree = true): Promise<void> {
    await this.page.getByRole('combobox', { name: /(How you’re related to|Su relación con|Votre lien avec) / }).selectOption({ label: relationship });
    if (agree) await this.page.getByRole('checkbox').check();
    await this.page.getByRole('textbox', { name: /(Type your full name to sign|Escriba su nombre completo para firmar|Tapez votre nom complet pour signer)/ }).fill(name);
    await this.page.getByRole('button', { name: /^(Give consent|Dar consentimiento|Donner mon consentement)$/ }).click();
  }

  async withdraw(): Promise<void> {
    await this.page.getByRole('button', { name: /^(Withdraw consent|Retirar el consentimiento|Retirer mon consentement)$/ }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: /^(Withdraw consent|Retirar el consentimiento|Retirer mon consentement)$/ }).click();
    await expect(this.dialog).toBeHidden();
  }
}
