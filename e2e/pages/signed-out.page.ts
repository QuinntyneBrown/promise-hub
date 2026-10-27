import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Signed out (mock: signed-out): the session has ended and the device keeps none of the person's data. */
export class SignedOutPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  async expectShown(): Promise<void> {
    await expect(this.page).toHaveURL(/\/signed-out$/);
    await expect(this.heading).toHaveText("You’re signed out");
  }

  async signInAgain(): Promise<void> {
    await this.page.getByRole("link", { name: "Sign in again" }).click();
  }
}
