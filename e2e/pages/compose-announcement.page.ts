import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export interface AnnouncementEntry {
  title?: string;
  body?: string;
  program?: string;
  audience?:
    "Youth" | "Youth and guardians" | "Guardians" | "Mentors" | "Everyone";
  later?: { date: string; time: string };
}

/** Each audience's hint, which is part of its radio's name. */
const HINT: Record<NonNullable<AnnouncementEntry["audience"]>, string> = {
  Youth: "Youth with an account in the program",
  "Youth and guardians": "Youth in the app; guardians by text or email",
  Guardians: "By text, or email when there’s no mobile",
  Mentors: "Mentors of the program, in the app",
  Everyone: "Youth, mentors and guardians",
};

/** The New announcement dialog (mock: compose-announcement), opened from Announcements. */
export class ComposeAnnouncementDialog extends BasePage {
  get dialog(): Locator {
    return this.page.getByRole("dialog", { name: "New announcement" });
  }

  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible();
  }

  async fill(entry: AnnouncementEntry): Promise<void> {
    const d = this.dialog;
    if (entry.title !== undefined)
      await d.getByLabel("Title", { exact: true }).fill(entry.title);
    if (entry.body !== undefined)
      await d.getByLabel("Message", { exact: true }).fill(entry.body);
    if (entry.program)
      await d
        .getByLabel("Program", { exact: true })
        .selectOption({ label: entry.program });
    if (entry.audience)
      await d
        .getByRole("radio", {
          name: `${entry.audience} ${HINT[entry.audience]}`,
          exact: true,
        })
        .check();
    if (entry.later) {
      await d
        .getByRole("radio", { name: "Schedule for later", exact: true })
        .check();
      await d.getByLabel("Date", { exact: true }).fill(entry.later.date);
      await d.getByLabel("Time", { exact: true }).fill(entry.later.time);
    }
  }

  async send(): Promise<void> {
    await this.dialog
      .getByRole("button", { name: /^(Send|Schedule)$/ })
      .click();
  }

  get summary(): Locator {
    return this.dialog
      .getByRole("alert")
      .filter({ hasText: "Fix these to continue" });
  }

  get failed(): Locator {
    return this.dialog.getByText("That didn’t go through");
  }

  field(label: string): Locator {
    return this.dialog.getByLabel(label, { exact: true });
  }

  error(message: string): Locator {
    return this.dialog.getByText(message).first();
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () =>
        (
          await fetch("/api/announcements", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title: "Room 2",
              body: "Room 2 tonight.",
              programId: null,
              audience: "Youth",
              sendAt: null,
            }),
          })
        ).status,
    );
  }
}
