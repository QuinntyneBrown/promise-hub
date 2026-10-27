import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Learning, the youth's lessons (mock: learning). */
export class LearningPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/learning");
  }

  async expectOpen(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Learning" }),
    ).toBeVisible();
  }

  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: "No lessons yet" });
  }

  /** What the API answers this signed-in person for their own record. */
  async apiStatus(): Promise<number> {
    return this.page.evaluate(
      async () => (await fetch("/api/learning/me")).status,
    );
  }

  /** The consent-required state (mock: consent-required). */
  get consentRequired(): Locator {
    return this.page.getByRole("heading", {
      name: "A guardian needs to give consent",
    });
  }

  get asked(): Locator {
    return this.page.getByRole("heading", { name: "We asked your guardian" });
  }

  get noGuardian(): Locator {
    return this.page.getByRole("heading", {
      name: "We can’t reach a guardian",
    });
  }

  get gate(): Locator {
    return this.page.getByTestId("consent-gate");
  }

  async askGuardian(): Promise<void> {
    await this.page.getByRole("button", { name: "Ask my guardian" }).click();
  }

  async checkAgain(): Promise<void> {
    await this.page.getByRole("button", { name: "Check again" }).click();
  }

  /** The waiting state of a youth in no program (mock: no-cohort). */
  get noCohort(): Locator {
    return this.page.getByRole("heading", {
      name: "You’re not in a program yet",
    });
  }

  /** The resume alert for a setup left unfinished (mock: learning/resume). */
  get resume(): Locator {
    return this.page.getByTestId("resume-setup");
  }

  async pickUpSetup(): Promise<void> {
    await this.page
      .getByRole("link", { name: "Pick up where I left off" })
      .click();
  }

  /** The Learning home's tracks card (mock: learn-home): shown once lessons open. */
  get yourTracks(): Locator {
    return this.page.getByRole("heading", { name: "Your tracks" });
  }

  /** One track on the home, by name. */
  track(name: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(name) });
  }

  get continueCard(): Locator {
    return this.page.getByRole("region", {
      name: "Continue where you left off",
    });
  }

  async continueLesson(): Promise<void> {
    await this.continueCard
      .getByRole("link", { name: "Continue lesson" })
      .click();
  }

  get overall(): Locator {
    return this.page.getByRole("progressbar", { name: "Your lessons" });
  }

  get greeting(): Locator {
    return this.page.locator("ph-page-header").getByText(/^Hi, /);
  }

  get caughtUp(): Locator {
    return this.page.getByRole("heading", { name: "You’re all caught up" });
  }

  /** What the API answers this signed-in person for their lessons. */
  async lessonsStatus(): Promise<number> {
    return this.page.evaluate(
      async () => (await fetch("/api/learning/home")).status,
    );
  }
}
