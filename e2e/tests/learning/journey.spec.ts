import { test, expect } from "../../fixtures/test";
import type { ModuleId } from "../../fixtures/seed";
import { LearnJourneyPage } from "../../pages/learn-journey.page";
import { LearningPage } from "../../pages/learning.page";
import { TodayPage } from "../../pages/today.page";

// Acceptance test. Traces to: L2-087 criteria 1 to 3, 7 to 9 (the journey: overall progress, streak, stage and the roadmap; empty, failed and
// not-open states; Learning off), L2-035 and L2-036 (axe, phone).
const SUITE: ModuleId[] = [
  "Roster",
  "Slips",
  "RollCall",
  "QuickCards",
  "Pickup",
  "Messages",
  "Incidents",
  "Reports",
];

test.describe("View the journey", () => {
  test.use({ signedInAs: "m-sofia" });

  test.beforeEach(({ api }) => {
    api.setModules("org-harbourview", [...SUITE, "Learning"]);
    api.giveConsent("c-sofia");
    api.saveOnboarding("m-sofia", {
      step: 3,
      preferredName: "Sofía",
      completed: true,
    });
    api.curriculumState.youthJourney();
  });

  test("Given she finished Knowing Yourself over the last two weeks, when Sofía opens Your journey from Learning, then she sees her progress, a 2-week streak and her roadmap with the current module", async ({
    page,
    api,
  }) => {
    api.learningState.completeOn(
      "m-sofia",
      "2026-10-22T16:00:00Z",
      "l-strengths",
    );
    api.learningState.completeOn("m-sofia", "2026-10-29T16:00:00Z", "l-values");
    const learning = new LearningPage(page);
    const journey = new LearnJourneyPage(page);
    await learning.open();

    await learning.openJourney();

    await journey.expectOpen();
    await expect(journey.subtitle).toContainText(
      "You’re in Leading by Serving now.",
    );
    await expect(journey.stat("Streak")).toHaveText("2 weeks");
    await expect(
      page.locator("ph-stat").filter({ hasText: "Overall progress" }),
    ).toContainText("2 of 8 lessons");
    await expect(
      journey.module("Leadership Foundations", "Knowing Yourself"),
    ).toContainText("Done");
    await expect(
      journey.module("Leadership Foundations", "Leading by Serving"),
    ).toContainText("0 of 3 lessons · you’re here");
    await expect(
      journey.module("Leadership Foundations", "Speaking Up"),
    ).toContainText("Unlocks after Leading by Serving");
    await expect(
      journey.moduleLink("Leadership Foundations", "Speaking Up"),
    ).toHaveCount(0);
    await expect(journey.module("Digital Skills", "Web Basics")).toContainText(
      "Not started",
    );
    await expect(journey.continueButton).toHaveText(
      /Continue Leading by Serving/,
    );
    await journey.expectAccessible();

    await journey.continueButton.click();

    await expect(page).toHaveURL(/\/learning\/modules\/cm-serving$/);
  });

  test("Given her mentor rated both Explorer competencies proficient, when she opens her journey, then Explorer is earned and she is at Contributor", async ({
    page,
    api,
  }) => {
    api.reviews.assess({
      childId: "c-sofia",
      competencyId: "cp-serves",
      level: "Proficient",
      notes: null,
      by: "Daniel Osei",
      at: "2026-10-29T16:00:00Z",
    });
    api.reviews.assess({
      childId: "c-sofia",
      competencyId: "cp-works",
      level: "Mastered",
      notes: null,
      by: "Daniel Osei",
      at: "2026-10-29T16:00:00Z",
    });
    const journey = new LearnJourneyPage(page);

    await journey.open();

    await expect(journey.stat("Stage")).toHaveText("Contributor");
    await expect(journey.stage("Explorer")).toContainText("Earned");
    await expect(journey.stage("Contributor")).toContainText("You’re here");
    await expect(journey.stage("Leader")).toContainText("Ahead");
    await expect(journey.stat("Streak")).toHaveText("0 weeks");
  });

  test("Given nothing is published for her programs, when she opens her journey, then it says the journey starts with her first track", async ({
    page,
    api,
  }) => {
    api.curriculumState.clear("org-harbourview");
    const journey = new LearnJourneyPage(page);

    await journey.open();

    await expect(journey.empty).toBeVisible();
    await journey.expectAccessible();
  });

  test("Given the journey fails to load, when she tries again after it recovers, then the journey shows", async ({
    page,
    api,
  }) => {
    api.failNext("/api/learning/journey", 500);
    const journey = new LearnJourneyPage(page);
    await journey.open();
    await expect(journey.failed).toBeVisible();
    await journey.expectAccessible();

    api.recover("/api/learning/journey");
    await page.getByRole("button", { name: "Try again" }).click();

    await expect(journey.stat("Streak")).toBeVisible();
  });

  test("Given Learning is off, when the journey is opened directly, then Today opens and the API answers 404", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", SUITE);
    const journey = new LearnJourneyPage(page);

    await journey.open();

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText("Welcome, Sofía");
    expect(await journey.apiStatus()).toBe(404);
  });

  test("Given a phone, when she opens her journey, then nothing scrolls sideways and it passes axe", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const journey = new LearnJourneyPage(page);

    await journey.open();

    await expect(journey.track("Leadership Foundations")).toBeVisible();
    await journey.expectNoHorizontalScroll();
    await journey.expectAccessible();
  });
});

test.describe("The journey before Learning opens", () => {
  test.use({ signedInAs: "m-sofia" });

  test("Given no guardian has consented, when Sofía opens her journey, then the server refuses and the page points to Learning", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", [...SUITE, "Learning"]);
    const journey = new LearnJourneyPage(page);

    await journey.open();

    await expect(journey.notOpen).toBeVisible();
    expect(await journey.apiStatus()).toBe(403);
    await journey.expectAccessible();
  });
});
