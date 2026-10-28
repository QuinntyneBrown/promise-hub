import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** The household's announcements on the guardian pages (mock: guardian-announcements). */
export class GuardianAnnouncementsPage extends BasePage {
  async open(token: string): Promise<void> {
    await super.open(`/g/home/${token}/announcements`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).not.toHaveText(/^(Loading|Cargando|Chargement)/);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get list(): Locator {
    return this.page.getByRole("list", {
      name: /^(Announcements|Anuncios|Annonces)$/,
    });
  }

  item(title: string): Locator {
    return this.list.getByRole("listitem").filter({ hasText: title });
  }

  get newBadges(): Locator {
    return this.list.getByText(/^(New|Nuevo|Nouveau)$/);
  }

  get markAllRead(): Locator {
    return this.page.getByRole("button", {
      name: /^(Mark all read|Marcar todos como leídos|Tout marquer comme lu)$/,
    });
  }

  status(text: string | RegExp): Locator {
    return this.page
      .getByRole("main")
      .getByRole("status")
      .filter({ hasText: text });
  }

  text(content: string | RegExp): Locator {
    return this.page.getByRole("main").getByText(content);
  }
}
