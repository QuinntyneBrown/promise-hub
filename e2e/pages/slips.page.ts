import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Permission slips (mock: slips): every slip with its answers and deadline. */
export class SlipsPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/slips");
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Permission slips" }),
    ).toBeVisible();
  }

  get list(): Locator {
    return this.page.getByRole("list", { name: "Permission slips" });
  }

  row(title: string): Locator {
    return this.list.getByRole("listitem").filter({ hasText: title });
  }
}
