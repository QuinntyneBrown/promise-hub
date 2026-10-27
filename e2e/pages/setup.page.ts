import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** The setup checklist (mock: setup) and the organization step (mock: onboard-org). */
export class SetupPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/setup");
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get progress(): Locator {
    return this.page.getByRole("progressbar", { name: "Setup progress" });
  }

  step(title: string): Locator {
    return this.page
      .getByRole("list", { name: "Setup steps" })
      .getByRole("listitem")
      .filter({ hasText: title });
  }

  async openStep(title: string): Promise<void> {
    await this.step(title).getByRole("link").click();
  }

  /** Opens the organization step and waits for the saved name, so typing never races the load. */
  async openOrganizationStep(): Promise<void> {
    await this.openStep("Name your organization");
    await expect(this.name).not.toHaveValue("");
  }

  get name(): Locator {
    return this.page.getByLabel("Organization name");
  }

  get city(): Locator {
    return this.page.getByLabel("City");
  }

  async saveOrganization(): Promise<void> {
    await this.page.getByRole("button", { name: "Save and continue" }).click();
  }

  async finishLater(): Promise<void> {
    await this.page.getByRole("link", { name: "Finish later" }).click();
  }

  get errorSummary(): Locator {
    return this.page.getByRole("alert");
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", {
      name: "Admins set up the organization",
    });
  }
}
