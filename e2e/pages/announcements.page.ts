import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Announcements for staff (mock: announcements): what was announced, to whom, and how many have read it. */
export class AnnouncementsPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/messages/announcements");
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get list(): Locator {
    return this.page.getByRole("list", { name: "Announcements, newest first" });
  }

  row(title: string): Locator {
    return this.list.getByRole("listitem").filter({ hasText: title });
  }

  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: "No announcements yet" });
  }

  get failed(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load announcements",
    });
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", {
      name: "Announcements are sent by directors and site leads",
    });
  }

  stat(label: string): Locator {
    return this.page.locator(".kpis").getByText(label).locator("..");
  }

  toast(title: string): Locator {
    return this.page.getByRole("status").filter({ hasText: title });
  }

  async newAnnouncement(): Promise<void> {
    await this.page
      .getByRole("button", { name: "New announcement" })
      .first()
      .click();
  }

  async openFromMessages(): Promise<void> {
    await this.page.getByRole("link", { name: "Announcements" }).click();
    await expect(this.heading).toHaveText("Announcements");
  }
}
