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

  async verify(contact: string, code: string): Promise<void> {
    await this.page.getByRole('main').getByRole('textbox').fill(contact);
    await this.page.getByRole('button', { name: /^(Send me a code|Envíenme un código|Envoyez-moi un code)$/ }).click();
    await this.page.getByRole('main').getByRole('textbox').fill(code);
    await this.page.getByRole('button', { name: /^(Continue|Continuar|Continuer)$/ }).click();
  }
}
