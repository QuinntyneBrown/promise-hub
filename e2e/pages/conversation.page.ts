import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** One conversation (mock: conversation): the message thread and its composer. */
export class ConversationPage extends BasePage {
  async open(youthId: string): Promise<void> {
    await super.open(`/conversations/${youthId}`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get log(): Locator {
    return this.page.getByRole("list", {
      name: /^Messages with .*, oldest first$/,
    });
  }

  message(text: string): Locator {
    return this.log.getByRole("listitem").filter({ hasText: text });
  }

  async bodies(): Promise<string[]> {
    await expect(this.log).toBeVisible();
    return this.log.locator(".bubble").allInnerTexts();
  }

  get field(): Locator {
    return this.page.getByLabel("Message", { exact: true });
  }

  get sendButton(): Locator {
    return this.page.getByRole("button", { name: "Send" });
  }

  async write(text: string): Promise<void> {
    await this.field.fill(text);
    await this.sendButton.click();
  }

  get blockedAlert(): Locator {
    return this.page
      .getByRole("status")
      .filter({ hasText: "Waiting for a guardian’s consent" });
  }

  get notSent(): Locator {
    return this.log.getByText("Not sent.");
  }

  async tryAgain(): Promise<void> {
    await this.log.getByRole("button", { name: "Try again" }).click();
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", {
      name: "This isn’t one of your conversations",
    });
  }

  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: /^Say hi to / });
  }

  text(content: string | RegExp): Locator {
    return this.page.getByRole("main").getByText(content);
  }

  async apiStatus(youthId: string): Promise<number> {
    return this.page.evaluate(
      async (id) =>
        (
          await fetch(`/api/conversations/${id}/messages`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ body: "Hi" }),
          })
        ).status,
      youthId,
    );
  }
}
