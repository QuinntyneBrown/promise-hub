import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Badges: her collection, badges earned and still to unlock, and her milestones (mock: learn-badges). */
export class LearnBadgesPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/learning/badges");
  }

  async expectOpen(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Badges" }),
    ).toBeVisible();
  }

  get subtitle(): Locator {
    return this.page.locator("ph-page-header p");
  }

  get collection(): Locator {
    return this.page.getByRole("progressbar", { name: "Badges earned" });
  }

  /** A badge of the Earned or Still to unlock list, by its name. */
  earned(name: string): Locator {
    return this.page
      .getByRole("list", { name: "Earned badges" })
      .getByRole("listitem")
      .filter({ hasText: name });
  }

  locked(name: string): Locator {
    return this.page
      .getByRole("list", { name: "Badges still to unlock" })
      .getByRole("listitem")
      .filter({ hasText: name });
  }

  get earnedNames(): Locator {
    return this.page
      .getByRole("list", { name: "Earned badges" })
      .locator("ph-achievement-badge .name");
  }

  /** A row of Your milestones, by its title. */
  milestone(title: string): Locator {
    return this.page
      .getByRole("list", { name: "Your milestones" })
      .getByRole("listitem")
      .filter({
        has: this.page.getByTestId("list-title").filter({ hasText: title }),
      });
  }

  get noneEarned(): Locator {
    return this.page.getByRole("heading", { name: "No badges yet" });
  }

  get noneToEarn(): Locator {
    return this.page.getByRole("heading", { name: "No badges to earn yet" });
  }

  get failed(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load your badges",
    });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () => (await fetch("/api/learning/badges")).status,
    );
  }
}
