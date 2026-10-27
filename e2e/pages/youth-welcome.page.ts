import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** The youth's first-run setup (mock: youth-welcome): you, preferences, your program. */
export class YouthWelcomePage extends BasePage {
  async open(): Promise<void> {
    await super.open("/learning/welcome");
  }

  async expectOpen(name: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name: `Welcome, ${name}` }),
    ).toBeVisible();
  }

  async expectStep(current: number, title: string): Promise<void> {
    await expect(this.page.getByTestId("stepper")).toContainText(
      `Step ${current} of 3`,
    );
    await expect(
      this.page.getByRole("heading", { level: 2, name: title }),
    ).toBeVisible();
  }

  get preferredName(): Locator {
    return this.page.getByLabel("What should we call you?");
  }

  get pronouns(): Locator {
    return this.page.getByLabel("Pronouns");
  }

  preference(
    label: "Lesson reminders" | "Mentor messages" | "Announcements",
  ): Locator {
    return this.page.getByRole("switch", { name: label });
  }

  get program(): Locator {
    return this.page.getByTestId("welcome-program");
  }

  get waiting(): Locator {
    return this.page.getByText("You’re not in a program yet");
  }

  get fieldError(): Locator {
    return this.page.getByText("Tell us what to call you.").first();
  }

  get errorSummary(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "Fix these to continue" });
  }

  get saveFailed(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "We couldn’t save that" });
  }

  async continue(): Promise<void> {
    await this.page.getByRole("button", { name: "Continue" }).click();
  }

  async back(): Promise<void> {
    await this.page.getByRole("button", { name: "Back" }).click();
  }

  async finishLater(): Promise<void> {
    await this.page.getByRole("link", { name: "Finish later" }).click();
  }

  async finish(): Promise<void> {
    await this.page.getByRole("button", { name: "Finish" }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }
}
