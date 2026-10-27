import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** A youth's track: its modules in order, the track switch (mock: learn-track). */
export class LearnTrackPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/learning/tracks/${id}`);
  }

  async expectOpen(name: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name }),
    ).toBeVisible();
  }

  get switcher(): Locator {
    return this.page.getByRole("group", { name: "Your tracks" });
  }

  trackButton(name: string): Locator {
    return this.switcher.getByRole("button", { name });
  }

  async switchTo(name: string): Promise<void> {
    await this.trackButton(name).click();
  }

  /** A module row, by its title. */
  module(title: string): Locator {
    return this.page
      .getByRole("listitem")
      .filter({
        has: this.page
          .getByTestId("list-title")
          .filter({ hasText: new RegExp(`^\\d+\\. ${title}$`) }),
      });
  }

  async openModule(title: string): Promise<void> {
    await this.moduleLink(title).click();
  }

  moduleLink(title: string): Locator {
    return this.page.getByRole("link", {
      name: new RegExp(`^\\d+\\. ${title}`),
    });
  }

  get progress(): Locator {
    return this.page.getByRole("progressbar");
  }

  get empty(): Locator {
    return this.page.getByRole("heading", { name: "No modules published yet" });
  }

  get notFound(): Locator {
    return this.page.getByRole("heading", { name: "We can’t find that track" });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(
      async (t) => (await fetch(`/api/learning/tracks/${t}`)).status,
      id,
    );
  }
}
