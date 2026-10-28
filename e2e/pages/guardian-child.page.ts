import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** A child's page on the guardian pages (mock: guardian-child): schedule, consents, attendance and Learning progress, read only. */
export class GuardianChildPage extends BasePage {
  async open(token: string, childId: string): Promise<void> {
    await super.open(`/g/home/${token}/children/${childId}`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).not.toHaveText(/^(Loading|Cargando|Chargement)/);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get language(): Promise<string | null> {
    return this.page.locator("html").getAttribute("lang");
  }

  private section(name: RegExp): Locator {
    return this.page.getByRole("region", { name });
  }

  get schedule(): Locator {
    return this.section(/^(Schedule|Horario|Horaire)$/);
  }

  session(name: string): Locator {
    return this.schedule.getByRole("listitem").filter({ hasText: name });
  }

  get consents(): Locator {
    return this.section(/^(Consents|Consentimientos|Consentements)$/);
  }

  consent(name: string | RegExp): Locator {
    return this.consents.getByRole("listitem").filter({ hasText: name });
  }

  get attendance(): Locator {
    return this.section(/^(Attendance|Asistencia|Présences)$/);
  }

  attendanceRow(date: string): Locator {
    return this.attendance.getByRole("listitem").filter({ hasText: date });
  }

  get learning(): Locator {
    return this.section(/^Learning$/);
  }

  module(name: string): Locator {
    return this.learning
      .getByRole("list", { name: /module|módulo/ })
      .getByRole("listitem")
      .filter({ hasText: name });
  }

  get badges(): Locator {
    return this.learning.getByRole("list", { name: /badges|insignias/i });
  }

  text(content: string | RegExp): Locator {
    return this.page.getByRole("main").getByText(content);
  }

  /** Buttons and form fields on the page: the child page is read only (L2-102 criterion 5). */
  async controlCount(): Promise<number> {
    const main = this.page.getByRole('main');
    return (await main.getByRole('button').count()) + (await main.getByRole('textbox').count()) + (await main.getByRole('combobox').count());
  }

  async back(): Promise<void> {
    await this.page
      .getByRole("link", {
        name: /^(Back to your family|Volver a su familia|Retour à votre famille)$/,
      })
      .click();
  }
}
