import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** A quiz's rules and where the youth stands with it (mock: learn-quiz-intro). */
export class LearnQuizIntroPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/learning/quizzes/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
  }

  /** A fact tile: Questions, Pass mark, Attempts or This attempt. */
  fact(label: string): Locator {
    return this.page.locator("ph-stat").filter({ hasText: label });
  }

  get rules(): Locator {
    return this.page.getByRole("region", { name: "Before you start" });
  }

  get startButton(): Locator {
    return this.page.getByRole("link", { name: "Start quiz" });
  }

  get resumeButton(): Locator {
    return this.page.getByRole("link", { name: "Resume quiz" });
  }

  get tryAgainButton(): Locator {
    return this.page.getByRole("link", { name: "Try again" });
  }

  get bestAttemptButton(): Locator {
    return this.page.getByRole("link", { name: "See your best attempt" });
  }

  async start(): Promise<void> {
    await this.startButton.click();
  }

  async resume(): Promise<void> {
    await this.resumeButton.click();
  }

  /** The alert above the rules: in progress, last attempt, passed or no attempts left. */
  get notice(): Locator {
    return this.page
      .getByRole("status")
      .filter({
        hasText: /part way|Last attempt|You passed|No attempts left|Waiting/,
      });
  }

  locked(what: string): Locator {
    return this.page.getByRole("heading", { name: `Finish ${what} first` });
  }

  get notFound(): Locator {
    return this.page.getByRole("heading", { name: "We can’t find that quiz" });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(
      async (q) => (await fetch(`/api/learning/quizzes/${q}`)).status,
      id,
    );
  }
}
