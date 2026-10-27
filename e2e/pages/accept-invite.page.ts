import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Accepting a staff invitation (mock: accept-invite) and the onboarding steps (mocks: onboard-staff-phone, onboard-staff-ready). */
export class AcceptInvitePage extends BasePage {
  async open(token: string): Promise<void> {
    await super.open(`/invite/${token}`);
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get invitedEmail(): Locator {
    return this.page.getByTestId("invited-email");
  }

  get passwordHelp(): Locator {
    return this.page.getByTestId("password-help");
  }

  fieldError(field: "name" | "password" | "mobile"): Locator {
    return this.page.getByTestId(`${field}-error`);
  }

  get subtitle(): Locator {
    return this.page.getByTestId("auth-subtitle");
  }

  get nameField(): Locator {
    return this.page.getByLabel("Your name");
  }

  async accept(
    name: string,
    password: string,
    button = "Accept and continue",
  ): Promise<void> {
    await this.nameField.fill(name);
    await this.page.getByLabel("Choose a password").fill(password);
    await this.page.getByRole("button", { name: button }).click();
  }

  async savePhone(mobile: string): Promise<void> {
    await this.page.getByLabel("Your mobile").fill(mobile);
    await this.page.getByRole("button", { name: "Continue" }).click();
  }

  get alreadyHaveAccount(): Locator {
    return this.page.getByRole("link", { name: "I already have an account" });
  }

  newLinkButton(inviter: string): Locator {
    return this.page.getByRole("button", {
      name: `Ask ${inviter} for a new link`,
    });
  }

  async askForNewLink(inviter: string): Promise<void> {
    await this.newLinkButton(inviter).click();
  }

  get openCheckIn(): Locator {
    return this.page.getByRole("link", { name: /^Open check-in/ });
  }
}
