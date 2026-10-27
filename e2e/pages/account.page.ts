import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Your account (mock: account), the recovery-codes dialog and the sign-out-all dialog. */
export class AccountPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/account");
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Your account" }),
    ).toBeVisible();
  }

  get profile(): Locator {
    return this.page.getByRole("region", { name: "Profile" });
  }

  get twoStep(): Locator {
    return this.page.getByRole("region", { name: "Two-step sign-in" });
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  async makeRecoveryCodes(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Make new recovery codes" })
      .click();
    await this.dialog.getByRole("button", { name: "Make new codes" }).click();
  }

  get codes(): Locator {
    return this.dialog
      .getByRole("list", { name: "Recovery codes" })
      .getByRole("listitem");
  }

  async closeCodes(): Promise<void> {
    await this.dialog.getByRole("button", { name: "I’ve saved them" }).click();
    await expect(this.dialog).toBeHidden();
  }

  async signOutEverywhereElse(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Sign out everywhere else" })
      .click();
    await this.dialog
      .getByRole("button", { name: "Sign out other devices" })
      .click();
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }

  async openFromAccountMenu(): Promise<void> {
    await this.page
      .getByRole("banner")
      .getByRole("button", { name: /^Account menu for/ })
      .click();
    await this.page.getByRole("menuitem", { name: "Your account" }).click();
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Your account" }),
    ).toBeVisible();
  }
}
