import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Staff coverage (mock: coverage): upcoming sessions, who works them, gaps, assigning staff and inviting youth workers. */
export class CoveragePage extends BasePage {
  async open(): Promise<void> {
    await super.open("/settings/coverage");
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  session(name: string): Locator {
    return this.page
      .getByRole("list", { name: "Upcoming sessions" })
      .getByRole("listitem")
      .filter({ hasText: name });
  }

  async assign(session: string, people: string[]): Promise<void> {
    await this.session(session)
      .getByRole("button", { name: `Assign staff to ${session}` })
      .click();
    await expect(this.dialog).toBeVisible();
    for (const name of people)
      await this.dialog.getByRole("checkbox", { name }).check();
    await this.dialog.getByRole("button", { name: "Save" }).click();
  }

  async openInvite(): Promise<void> {
    await this.page.getByRole("button", { name: "Invite a volunteer" }).click();
    await expect(this.dialog).toBeVisible();
  }

  async inviteVolunteer(email: string): Promise<void> {
    await this.dialog.getByLabel("Work email").fill(email);
    await this.dialog.getByRole("button", { name: "Send invitation" }).click();
  }

  roleChoices(): Locator {
    return this.dialog.getByRole("radio");
  }
}
