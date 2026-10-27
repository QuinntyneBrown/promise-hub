import { test, expect } from "../../fixtures/test";
import type { ModuleId } from "../../fixtures/seed";
import { LearningPage } from "../../pages/learning.page";
import { ShellPage } from "../../pages/shell.page";
import { TodayPage } from "../../pages/today.page";

// L2-005 criteria 6 and 8, L2-007 criterion 9, L2-056 criterion 5, L2-059: Learning opens only while its module is on, for youth.
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

test.describe("Learning", () => {
  test.use({ signedInAs: "m-sofia" });

  test("Given Learning is on and her guardian has consented, when Sofía follows Learning from Today, then her lessons page says none are published yet", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", [...SUITE, "Learning"]);
    api.giveConsent("c-sofia");
    api.saveOnboarding("m-sofia", {
      step: 3,
      preferredName: "Sofía",
      completed: true,
    });
    api.curriculumState.clear("org-harbourview");
    const learning = new LearningPage(page);
    await new TodayPage(page).open();

    await new ShellPage(page).primaryNavigation
      .getByRole("link", { name: "Learning" })
      .click();

    await learning.expectOpen();
    await expect(learning.emptyState).toBeVisible();
    expect(await learning.apiStatus()).toBe(200);
    await learning.expectAccessible();
    await learning.expectNoHorizontalScroll();
  });

  test("Given Learning is off, when /learning is opened directly, then Today opens and the API answers 404", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", SUITE);
    const learning = new LearningPage(page);

    await learning.open();

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toHaveText("Welcome, Sofía");
    expect(await learning.apiStatus()).toBe(404);
  });
});
