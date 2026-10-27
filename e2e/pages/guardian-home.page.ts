import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The guardian home (mock: guardian-home) opened from an enrollment decision text, with the code check. */
export class GuardianHomePage extends BasePage {
  async open(token: string): Promise<void> {
    await super.open(`/g/home/${token}`);
    await expect(this.heading).toBeVisible();
    await expect(this.heading).not.toHaveText(/^(Loading|Cargando|Chargement)/);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get enrollments(): Locator {
    return this.page.getByRole('main').getByRole('list');
  }

  get language(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }

  row(child: string, program: string): Locator {
    return this.enrollments.getByRole('listitem').filter({ hasText: `${child} · ${program}` });
  }

  text(content: string | RegExp): Locator {
    return this.page.getByRole('main').getByText(content);
  }

  pickups(child: string): Locator {
    return this.page.getByRole('list', { name: new RegExp(`${child}`) });
  }

  async addPickup(child: string, name: string, relationship: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(`^(Add someone for|Agregar a alguien para|Ajouter quelqu’un pour) ${child}`) }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('textbox').first().fill(name);
    await dialog.getByRole('textbox').nth(1).fill(relationship);
    await dialog.getByRole('button', { name: /^(Add|Agregar|Ajouter)$/ }).click();
  }

  async removePickup(name: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(`^(Remove|Quitar|Retirer) ${name}`) }).click();
    await this.page.getByRole('dialog').getByRole('button', { name: /^(Remove|Quitar|Retirer)$/ }).click();
  }

  get details(): Locator {
    return this.page.getByRole('region', { name: /^(Your details|Sus datos|Vos coordonnées)$/ });
  }

  async updateDetails(changes: { mobile?: string; email?: string; language?: string }): Promise<void> {
    await this.page.getByRole('button', { name: /^(Update your details|Actualizar sus datos|Mettre à jour vos coordonnées)$/ }).click();
    const dialog = this.page.getByRole('dialog');
    if (changes.mobile !== undefined) await dialog.getByRole('textbox', { name: /^(Mobile|Celular|Cellulaire)/ }).fill(changes.mobile);
    if (changes.email !== undefined) await dialog.getByRole('textbox', { name: /^(Email|Correo|Courriel)/ }).fill(changes.email);
    if (changes.language !== undefined) await dialog.getByRole('combobox').selectOption({ label: changes.language });
    await dialog.getByRole('button', { name: /^(Save|Guardar|Enregistrer)$/ }).click();
  }

  async updateMedical(child: string, allergies: string, medication: string): Promise<void> {
    await this.page.getByRole('button', { name: new RegExp(`^(Update ${child}’s medical details|Actualizar los datos médicos de ${child}|Mettre à jour la santé de ${child})$`) }).click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('textbox').first().fill(allergies);
    await dialog.getByRole('textbox').nth(1).fill(medication);
    await dialog.getByRole('button', { name: /^(Save|Guardar|Enregistrer)$/ }).click();
  }

  /** Opens the data request, picks copy or deletion and sends it to the email (left as filled in when not given). */
  async askForData(open: string, kind: string, send: string, email?: string): Promise<void> {
    await this.page.getByRole('button', { name: open }).click();
    await this.dialog.getByRole('radio', { name: kind }).check();
    if (email !== undefined) await this.dialog.getByRole('textbox').fill(email);
    await this.dialog.getByRole('button', { name: send }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get pickupRequest(): Locator {
    return this.page.getByRole('main').getByRole('status').filter({ hasText: /to collect|para recoger|chercher/ });
  }

  async decidePickup(approve: boolean): Promise<void> {
    await this.pickupRequest.getByRole('button', { name: approve ? /^(Approve|Aprobar|Approuver)$/ : /^(Refuse|Rechazar|Refuser)$/ }).click();
  }

  get noShowAlert(): Locator {
    return this.page.getByRole('main').getByRole('status').filter({ hasText: /checked in|registrad|enregistr/ });
  }

  get answered(): Locator {
    return this.page.getByRole('main').getByRole('status').filter({ hasText: /^(Thanks|Gracias|Merci)/ });
  }

  async answer(reply: 'On the way' | 'Absent tonight'): Promise<void> {
    await this.noShowAlert.getByRole('button', { name: reply }).click();
  }

  async verify(contact: string, code: string): Promise<void> {
    await this.page.getByRole('main').getByRole('textbox').fill(contact);
    await this.page.getByRole('button', { name: /^(Send me a code|Envíenme un código|Envoyez-moi un code)$/ }).click();
    // Wait for the code step: filling straight away can still hit the contact field on a slow machine.
    await this.page.getByRole('main').getByLabel(/^(Six-digit code|Código de seis dígitos|Code à six chiffres)/).fill(code);
    await this.page.getByRole('button', { name: /^(Continue|Continuar|Continuer)$/ }).click();
  }
}
