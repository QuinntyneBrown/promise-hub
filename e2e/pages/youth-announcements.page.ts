import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** A youth's or mentor's announcements (mock: youth-announcements). */
export class YouthAnnouncementsPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/announcements");
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get list(): Locator {
    return this.page.getByRole("list", { name: "Announcements, newest first" });
  }

  item(title: string): Locator {
    return this.list.getByRole("listitem").filter({ hasText: title });
  }

  async titles(): Promise<string[]> {
    await expect(this.list).toBeVisible();
    return this.list.getByRole("listitem").locator(".title").allInnerTexts();
  }

  get newBadges(): Locator {
    return this.list.getByText("New", { exact: true });
  }

  get markAllRead(): Locator {
    return this.page.getByRole("button", { name: "Mark all read" });
  }

  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: "No announcements yet" });
  }

  get failed(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load your announcements",
    });
  }

  get markFailed(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "That didn’t go through" });
  }

  toast(title: string): Locator {
    return this.page.getByRole("status").filter({ hasText: title });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () => (await fetch("/api/announcements/mine")).status,
    );
  }
}
