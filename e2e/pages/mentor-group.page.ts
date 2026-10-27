import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** A cohort the mentor leads or supports (mock: mentor-group). */
export class MentorGroupPage extends BasePage {
  async open(programId: string): Promise<void> {
    await super.open(`/mentoring/cohorts/${programId}`);
  }

  async expectOpen(name: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name }),
    ).toBeVisible();
  }

  get subtitle(): Locator {
    return this.page.locator("ph-page-header .subtitle");
  }

  get members(): Locator {
    return this.page
      .getByRole("list", { name: "Members" })
      .getByTestId("list-title");
  }

  member(name: string): Locator {
    return this.page
      .getByRole("list", { name: "Members" })
      .getByRole("listitem")
      .filter({ hasText: name });
  }

  get mentors(): Locator {
    return this.page
      .getByRole("list", { name: "Mentors" })
      .getByRole("listitem");
  }

  get noMembers(): Locator {
    return this.page.getByRole("heading", {
      name: "No youth in this cohort yet",
    });
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", {
      name: "You’re not a mentor on this cohort",
    });
  }

  get failed(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load this cohort",
    });
  }

  async retry(): Promise<void> {
    await this.page.getByRole("button", { name: "Try again" }).click();
  }

  async openMember(name: string): Promise<void> {
    await this.page
      .getByRole("list", { name: "Members" })
      .getByRole("link", { name: new RegExp(`^${name}`) })
      .click();
  }

  async apiStatus(programId: string): Promise<number> {
    return this.page.evaluate(
      async (id) => (await fetch(`/api/mentoring/cohorts/${id}`)).status,
      programId,
    );
  }
}
