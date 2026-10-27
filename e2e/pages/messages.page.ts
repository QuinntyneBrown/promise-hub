import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Messages (mock: messages): the list of sent messages. */
export class MessagesPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/messages");
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get list(): Locator {
    return this.page.getByRole("list", { name: "Sent messages" });
  }

  get capAlert(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "SMS segments this month" });
  }

  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: "No messages yet" });
  }

  row(title: string): Locator {
    return this.list.getByRole("listitem").filter({ hasText: title });
  }

  async newMessage(): Promise<void> {
    await this.page.getByRole("link", { name: "New message" }).first().click();
    await expect(this.heading).toHaveText("New message");
  }
}
