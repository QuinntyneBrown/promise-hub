import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** The guardian's survey page (mock: survey). */
export class GuardianSurveyPage extends BasePage {
  async open(token: string): Promise<void> {
    await super.open(`/g/survey/${token}`);
    await expect(this.heading).toBeVisible();
    await expect(this.heading).not.toHaveText(/^(Loading|Cargando|Chargement)/);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get language(): Promise<string | null> {
    return this.page.locator("html").getAttribute("lang");
  }

  async rate(n: number): Promise<void> {
    await this.page
      .getByRole("radio", { name: String(n), exact: true })
      .check();
  }

  async comment(text: string): Promise<void> {
    await this.page.getByRole("textbox").fill(text);
  }

  async send(label: string): Promise<void> {
    await this.page.getByRole("button", { name: label }).click();
  }

  get ratingError(): Locator {
    return this.page
      .getByRole("group")
      .getByText(/1/)
      .filter({ hasText: /5/ })
      .last();
  }
}
