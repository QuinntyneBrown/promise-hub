import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Your account › Notifications (mock: account-notifications): one switch per kind the member receives, and Save changes. */
export class NotificationPreferencesPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1, name: "Notifications" });
  }

  async open(): Promise<void> {
    await super.open("/account/notifications");
    await expect(this.heading).toBeVisible();
  }

  get switches(): Locator {
    return this.page.getByRole("switch");
  }

  choice(name: string): Locator {
    return this.page.getByRole("switch", { name, exact: true });
  }

  async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Save changes" }).click();
  }

  get saved(): Locator {
    return this.page
      .getByRole("status")
      .getByText("Notification preferences saved");
  }

  get failed(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "That didn’t go through" });
  }

  get empty(): Locator {
    return this.page.getByRole("heading", { name: "Nothing to choose yet" });
  }

  get loadError(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load your notification preferences",
    });
  }

  async tryAgain(): Promise<void> {
    await this.page.getByRole("button", { name: "Try again" }).click();
  }
}
