import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Billing (mock: billing) and the change-plan dialog (mock: change-plan). */
export class BillingPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/settings/billing");
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  get subtitle(): Locator {
    return this.page.getByTestId("page-subtitle");
  }

  meter(label: string): Locator {
    return this.page.getByRole("progressbar", {
      name: new RegExp(`^${label}`),
    });
  }

  alert(title: string): Locator {
    return this.page.getByText(title);
  }

  async changeTo(plan: string): Promise<void> {
    await this.page.getByRole("button", { name: "Change plan" }).click();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByRole("radio", { name: new RegExp(`^${plan} ·`) }).check();
    await dialog.getByRole("button", { name: "Change plan" }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", { name: "Admins manage billing" });
  }
}
