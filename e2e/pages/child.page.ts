import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** A child's profile (mock: child) with the edit and edit-medical dialogs. */
export class ChildPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get medical(): Locator {
    return this.page.getByRole("region", { name: "Medical and emergency" });
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  fact(term: string): Locator {
    return this.medical.getByTestId(`fact-${term}`);
  }

  get restricted(): Locator {
    return this.medical.getByText("Medical details are hidden for your role");
  }

  async editMedical(values: {
    allergies?: string;
    medication?: string;
  }): Promise<void> {
    await this.medical.getByRole("button", { name: "Edit medical" }).click();
    await expect(this.dialog).toBeVisible();
    if (values.allergies !== undefined)
      await this.dialog.getByLabel("Allergies").fill(values.allergies);
    if (values.medication !== undefined)
      await this.dialog.getByLabel("Medication").fill(values.medication);
    await this.dialog.getByRole("button", { name: /^Save/ }).click();
    await expect(this.dialog).toBeHidden();
  }

  async editDetails(values: { school?: string }): Promise<void> {
    await this.page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(this.dialog).toBeVisible();
    if (values.school !== undefined)
      await this.dialog
        .getByLabel("School and grade (optional)")
        .fill(values.school);
    await this.dialog.getByRole("button", { name: "Save" }).click();
    await expect(this.dialog).toBeHidden();
  }

  get youthAccount(): Locator {
    return this.page.getByRole("region", { name: "Youth account" });
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }

  dialogError(field: string): Locator {
    return this.dialog.getByTestId(`${field}-error`);
  }

  async openInviteYouth(): Promise<void> {
    await this.youthAccount
      .getByRole("button", { name: "Invite to PromiseHub" })
      .click();
    await expect(this.dialog).toBeVisible();
  }

  async sendYouthInvitation(email: string): Promise<void> {
    await this.dialog.getByRole("textbox", { name: /’s email$/ }).fill(email);
    await this.dialog.getByRole("button", { name: "Send invitation" }).click();
  }

  get subtitle(): Locator {
    return this.page.getByTestId("page-subtitle");
  }

  get consent(): Locator {
    return this.page.getByRole("region", { name: "Guardian consent" });
  }

  async sendConsentLink(): Promise<void> {
    await this.consent
      .getByRole("button", { name: "Send consent link" })
      .click();
  }

  /** What the API answers this signed-in person for a child's consent. */
  async consentApiStatus(childId: string): Promise<number> {
    return this.page.evaluate(
      async (id) => (await fetch(`/api/children/${id}/consent`)).status,
      childId,
    );
  }
}
