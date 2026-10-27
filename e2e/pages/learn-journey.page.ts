import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Your journey: overall progress, streak, badges, stage and the roadmap of her tracks (mock: learn-journey). */
export class LearnJourneyPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/learning/journey");
  }

  async expectOpen(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Your journey" }),
    ).toBeVisible();
  }

  get subtitle(): Locator {
    return this.page.locator("ph-page-header p");
  }

  /** The value of a number on the page, by its label (Overall progress, Streak, Badges, Stage). */
  stat(label: string): Locator {
    return this.page
      .locator("ph-stat")
      .filter({ hasText: label })
      .getByTestId("stat-value");
  }

  /** A track's card on the roadmap. */
  track(name: string): Locator {
    return this.page.getByRole("region", { name });
  }

  /** A module row of a track, by its title. */
  module(track: string, title: string): Locator {
    return this.track(track)
      .getByRole("listitem")
      .filter({
        has: this.page
          .getByTestId("list-title")
          .filter({ hasText: new RegExp(`^\\d+\\. ${title}$`) }),
      });
  }

  moduleLink(track: string, title: string): Locator {
    return this.track(track).getByRole("link", {
      name: new RegExp(`^\\d+\\. ${title}`),
    });
  }

  get continueButton(): Locator {
    return this.page.getByRole("link", { name: /^Continue / });
  }

  /** A stage row of Your stage, by its name. */
  stage(name: string): Locator {
    return this.page
      .getByRole("region", { name: "Your stage" })
      .getByRole("listitem")
      .filter({
        has: this.page
          .getByTestId("list-title")
          .filter({ hasText: new RegExp(`^\\d+\\. ${name}$`) }),
      });
  }

  get empty(): Locator {
    return this.page.getByRole("heading", {
      name: "Your journey starts with your first track",
    });
  }

  get failed(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load your journey",
    });
  }

  get notOpen(): Locator {
    return this.page.getByRole("heading", {
      name: "Learning isn’t open for you yet",
    });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () => (await fetch("/api/learning/journey")).status,
    );
  }
}
