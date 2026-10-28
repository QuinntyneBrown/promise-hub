import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Forgot password (mock: forgot-password) and reset password (mock: reset-password). */
export class ResetPasswordPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId("auth-subtitle");
  }

  get emailField(): Locator {
    return this.page.getByLabel("Email", { exact: true });
  }

  async askForLink(email: string): Promise<void> {
    await this.emailField.fill(email);
    await this.page
      .getByRole("button", { name: "Email me a reset link" })
      .click();
  }

  /** Resends and waits for the API to answer, so each request is counted before the next. */
  async resend(): Promise<void> {
    const answered = this.page.waitForResponse((r) =>
      r.url().endsWith("/api/auth/forgot-password"),
    );
    await this.page.getByRole("button", { name: "Resend the email" }).click();
    await answered;
  }

  get backToSignIn(): Locator {
    return this.page.getByRole("link", { name: "Back to sign in" });
  }

  toast(title: string): Locator {
    return this.page.getByTestId("toast").filter({ hasText: title });
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

  get showPasswordToggles(): Locator {
    return this.page.getByRole("button", { name: "Show password" });
  }

  passwordInput(label: "New password" | "Repeat it"): Locator {
    return this.page.getByLabel(label);
  }

  fieldError(field: "password" | "repeat" | "email"): Locator {
    return this.page.getByTestId(`${field}-error`);
  }
}
