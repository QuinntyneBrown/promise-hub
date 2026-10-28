import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Messages between a mentor and a youth (mock: conversations): one row per conversation. */
export class ConversationsPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/conversations");
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get list(): Locator {
    return this.page.getByRole("list", { name: "Conversations" });
  }

  row(name: string): Locator {
    return this.list.getByRole("listitem").filter({ hasText: name });
  }

  async names(): Promise<string[]> {
    await expect(this.list).toBeVisible();
    return this.list.getByRole("listitem").locator(".title").allInnerTexts();
  }

  async openConversation(name: string): Promise<void> {
    await this.row(name).getByRole("link").click();
  }

  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: "No conversations yet" });
  }

  get failed(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load your messages",
    });
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", {
      name: "Direct messages are for mentors and youth",
    });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () => (await fetch("/api/conversations")).status,
    );
  }
}
