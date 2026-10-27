import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** The guardian's slip page (mock: slip-sign) with the code check and the decline dialog (mock: decline-slip). */
export class GuardianSlipPage extends BasePage {
  async open(token: string): Promise<void> {
    await super.open(`/g/slip/${token}`);
    await expect(this.heading).toBeVisible();
    await expect(this.heading).not.toHaveText(/^(Loading|Cargando|Chargement)/);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  get footer(): Locator {
    return this.page.getByRole("contentinfo");
  }

  /** The one primary action on a closed or expired link: call the organization. */
  get callButton(): Locator {
    return this.page
      .getByRole("main")
      .getByRole("link", { name: /^(Call|Llamar al|Appeler le) / });
  }

  get receipt(): Locator {
    return this.page.getByRole("status").filter({ has: this.heading });
  }

  get language(): Promise<string | null> {
    return this.page.locator("html").getAttribute("lang");
  }

  fieldError(field: "contact" | "code" | "name"): Locator {
    return this.page.getByTestId(`${field}-error`);
  }

  text(content: string | RegExp): Locator {
    return this.page.getByText(content);
  }

  async identify(
    contact: string,
    label = "Your mobile number or email",
  ): Promise<void> {
    await this.page.getByLabel(label).fill(contact);
    await this.page
      .getByRole("button", {
        name: /^(Send me a code|Envíenme un código|Envoyez-moi un code)$/,
      })
      .click();
  }

  async enterCode(code: string, label = "Six-digit code"): Promise<void> {
    await this.page.getByLabel(label).fill(code);
    await this.page
      .getByRole("button", { name: /^(Continue|Continuar|Continuer)$/ })
      .click();
  }

  async sign(name: string): Promise<void> {
    await this.page.getByLabel("Type your full name to sign").fill(name);
    await this.page.getByRole("button", { name: "Sign the slip" }).click();
  }

  async decline(reason: string, child: string): Promise<void> {
    await this.page
      .getByRole("button", { name: `${child} can’t come` })
      .click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel("Why not? (optional)").fill(reason);
    await this.dialog.getByRole("button", { name: "Decline" }).click();
    await expect(this.dialog).toBeHidden();
  }
}
