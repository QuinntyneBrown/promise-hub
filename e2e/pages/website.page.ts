import type { Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** An organization's public website at /site/{slug} (mock: website). Anonymous. */
export class WebsitePage extends BasePage {
  async open(slug: string): Promise<void> {
    await super.open(`/site/${slug}`);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get placeholder(): Locator {
    return this.page.getByRole("heading", {
      name: "Our pages are being written",
    });
  }
}
