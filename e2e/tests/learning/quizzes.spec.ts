import { test, expect } from "../../fixtures/test";
import type { ModuleId } from "../../fixtures/seed";
import { LearnModulePage } from "../../pages/learn-module.page";
import { LearnQuizIntroPage } from "../../pages/learn-quiz-intro.page";
import { TodayPage } from "../../pages/today.page";

// Acceptance test. Traces to: L2-075 criteria 1, 2, 8 and 9 (a quiz's rules, its lock, the module's quizzes, Learning off), L2-035.
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
const SERVING = ["l-strengths", "l-values", "l-towel", "l-line", "l-coach"];

test.describe("Take quizzes", () => {
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
    api.curriculumState.assessments.quizJourney();
  });

  test("Given every lesson of Leading by Serving is done, when Sofía opens the quiz from the module, then she sees its rules and Start quiz", async ({
    page,
    api,
  }) => {
    api.learningState.complete("m-sofia", ...SERVING);
    const module = new LearnModulePage(page);
    const intro = new LearnQuizIntroPage(page);
    await module.open("cm-serving");
    await expect(module.quiz("Leading by Serving quiz")).toContainText(
      "Up next",
    );

    await module.openQuiz("Leading by Serving quiz");

    await intro.expectOpen("Leading by Serving quiz");
    await expect(intro.fact("Questions")).toContainText("4");
    await expect(intro.fact("Pass mark")).toContainText("70%");
    await expect(intro.fact("Attempts")).toContainText("2");
    await expect(intro.fact("This attempt")).toContainText("1 of 2");
    await expect(intro.rules).toContainText(
      "Once you submit, you can’t change your answers for that attempt.",
    );
    await expect(intro.startButton).toBeVisible();
    await expect(
      page.getByText("Packed the kit bags for everyone"),
    ).toHaveCount(0);
    await intro.expectNoHorizontalScroll();
    await intro.expectAccessible();
  });

  test("Given a lesson of the module is not done, when she opens the quiz, then it is locked, named on the module, and the server refuses it", async ({
    page,
    api,
  }) => {
    api.learningState.complete(
      "m-sofia",
      "l-strengths",
      "l-values",
      "l-towel",
      "l-line",
    );
    const module = new LearnModulePage(page);
    const intro = new LearnQuizIntroPage(page);
    await module.open("cm-serving");
    await expect(module.quiz("Leading by Serving quiz")).toContainText(
      "Unlocks after Leading Like a Coach",
    );

    await intro.open("qz-serving");

    await expect(intro.locked("Leading Like a Coach")).toBeVisible();
    expect(await intro.apiStatus("qz-serving")).toBe(403);
    await intro.expectAccessible();
  });

  test("Given a draft quiz, when she opens it, then it is not found", async ({
    page,
    api,
  }) => {
    api.learningState.complete("m-sofia", ...SERVING);
    api.curriculumState.assessments.quizzes.find(
      (q) => q.id === "qz-serving",
    )!.status = "Draft";
    const intro = new LearnQuizIntroPage(page);

    await intro.open("qz-serving");

    await expect(intro.notFound).toBeVisible();
    expect(await intro.apiStatus("qz-serving")).toBe(404);
  });

  test("Given Learning is off, when a quiz is opened directly, then Today opens and the API answers 404", async ({
    page,
    api,
  }) => {
    api.learningState.complete("m-sofia", ...SERVING);
    api.setModules("org-harbourview", SUITE);
    const intro = new LearnQuizIntroPage(page);

    await intro.open("qz-serving");

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText("Welcome, Sofía");
    expect(await intro.apiStatus("qz-serving")).toBe(404);
  });
});
