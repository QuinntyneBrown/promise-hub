import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Settings › Privacy and data (mock: settings-privacy). */
export class SettingsPrivacyPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/settings/privacy");
    await expect(this.page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  get region(): Locator {
    return this.page.getByTestId("fact-region");
  }

  retention(label: string): Locator {
    return this.page.getByRole("radio", { name: label });
  }

  request(household: string): Locator {
    return this.page
      .getByRole("list", { name: "Requests from guardians" })
      .getByRole("listitem")
      .filter({ hasText: `${household} household` });
  }

  async fulfil(household: string): Promise<void> {
    await this.request(household).getByRole("button").click();
  }

  async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Save retention" }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", { name: "Admins set privacy" });
  }

  get loadError(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load privacy settings",
    });
  }

  get consentCard(): Locator {
    return this.page.getByRole("region", { name: "Guardian consent" });
  }

  get consentAge(): Locator {
    return this.page.getByTestId("fact-consent-age");
  }

  get consentWording(): Locator {
    return this.page.getByTestId("fact-consent-wording");
  }

  get consentPolicyDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Edit consent policy" });
  }

  async editConsentPolicy(): Promise<void> {
    await this.page
      .getByRole("button", { name: "Edit consent policy" })
      .click();
    await expect(this.consentPolicyDialog).toBeVisible();
  }

  async saveConsentPolicy(age: string, wording: string): Promise<void> {
    await this.consentPolicyDialog
      .getByLabel("Consent needed under")
      .selectOption({ label: age });
    await this.consentPolicyDialog
      .getByLabel("Wording guardians sign")
      .fill(wording);
    await this.consentPolicyDialog
      .getByRole("button", { name: "Save policy" })
      .click();
  }

  /** What the API answers this signed-in person for the consent policy. */
  async consentApiStatus(): Promise<number> {
    return this.page.evaluate(
      async () => (await fetch("/api/settings/consent")).status,
    );
  }
}
