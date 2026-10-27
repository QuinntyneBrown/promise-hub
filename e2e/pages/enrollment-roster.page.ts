import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** A program's roster for review (mock: roster) with the review-enrollment and bulk-review dialogs. */
export class EnrollmentRosterPage extends BasePage {
  async open(programId: string): Promise<void> {
    await super.open(`/programs/${programId}/roster`);
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId("page-subtitle");
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  get bulkBar(): Locator {
    return this.page.getByRole("region", { name: "Selected enrollments" });
  }

  list(name: "Waiting review" | "Enrolled" | "Waitlist"): Locator {
    return this.page.getByRole("list", { name });
  }

  row(
    list: "Waiting review" | "Enrolled" | "Waitlist",
    child: string,
  ): Locator {
    return this.list(list).getByRole("listitem").filter({ hasText: child });
  }

  async tab(name: "Waiting review" | "Enrolled" | "Waitlist"): Promise<void> {
    await this.page.getByRole("tab", { name: new RegExp(`^${name}`) }).click();
  }

  async review(child: string, action: "Accept" | "Waitlist"): Promise<void> {
    await this.row("Waiting review", child)
      .getByRole("button", { name: `${action} ${child}` })
      .click();
    await expect(this.dialog).toBeVisible();
  }

  async decide(
    decision: "Accept" | "Waitlist" | "Decline",
    note?: string,
  ): Promise<void> {
    await this.dialog
      .getByRole("radio", { name: new RegExp(`^${decision}`) })
      .check();
    if (note !== undefined) await this.dialog.getByRole("textbox").fill(note);
    await this.dialog
      .getByRole("button", { name: /^(Accept|Waitlist|Decline) and text / })
      .click();
  }

  async moveIn(child: string, note?: string): Promise<void> {
    await this.row("Waitlist", child)
      .getByRole("button", { name: `Move in ${child}` })
      .click();
    await expect(this.dialog).toBeVisible();
    if (note !== undefined) await this.dialog.getByRole("textbox").fill(note);
    await this.dialog
      .getByRole("button", { name: /^Move in and text / })
      .click();
  }

  moveInButton(child: string): Locator {
    return this.row("Waitlist", child).getByRole("button", {
      name: `Move in ${child}`,
    });
  }

  async select(child: string): Promise<void> {
    await this.row("Waiting review", child)
      .getByRole("checkbox", { name: `Select ${child}` })
      .check();
  }

  async bulk(action: "Accept" | "Waitlist"): Promise<void> {
    await this.bulkBar
      .getByRole("button", { name: new RegExp(`^${action} \\d+$`) })
      .click();
    await expect(this.dialog).toBeVisible();
    await this.dialog
      .getByRole("button", { name: new RegExp(`^${action} \\d+$`) })
      .click();
  }
}
