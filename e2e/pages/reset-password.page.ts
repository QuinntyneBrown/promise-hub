import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Forgot password (mock: forgot-password) and reset password (mock: reset-password). */
export class ResetPasswordPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  async askForLink(email: string): Promise<void> {
    await this.page.getByLabel("Work email").fill(email);
    await this.page
      .getByRole("button", { name: "Email me a reset link" })
      .click();
  }

  async openLink(token: string): Promise<void> {
    await super.open(`/reset-password?token=${token}`);
    await expect(this.heading).not.toHaveText("Checking your link…");
  }

  async choose(password: string, repeat = password): Promise<void> {
    await this.page.getByLabel("New password").fill(password);
    await this.page.getByLabel("Repeat it").fill(repeat);
    await this.page
      .getByRole("button", { name: "Set password and sign in" })
      .click();
  }

  get passwordHelp(): Locator {
    return this.page.getByTestId("password-help");
  }

  fieldError(field: "password" | "repeat" | "email"): Locator {
    return this.page.getByTestId(`${field}-error`);
  }
}
