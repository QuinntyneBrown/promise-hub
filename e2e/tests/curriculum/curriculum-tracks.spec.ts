import { test, expect } from "../../fixtures/test";
import type { ModuleId } from "../../fixtures/seed";
import { CurriculumModulePage } from "../../pages/curriculum-module.page";
import { CurriculumPage } from "../../pages/curriculum.page";

// Acceptance test. Traces to: L2-066 criteria 1 to 5, 8 and 10 (tracks, ordered modules and the module editor).
const ON: ModuleId[] = [
  "Roster",
  "Slips",
  "RollCall",
  "QuickCards",
  "Pickup",
  "Messages",
  "Incidents",
  "Reports",
  "Learning",
];

test.describe("Authoring tracks and modules", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given Harbourview’s curriculum, when Marisol opens Curriculum, then each track shows its status, its modules in order and the counts", async ({
    page,
  }) => {
    const curriculum = new CurriculumPage(page);

    await curriculum.openLoaded();

    await expect(curriculum.stat("tracks")).toHaveText("2");
    await expect(curriculum.stat("modules")).toHaveText("4");
    await expect(curriculum.trackStatus("Leadership Foundations")).toHaveText(
      "Published",
    );
    await expect(curriculum.trackStatus("Digital Skills")).toHaveText("Draft");
    await expect(
      curriculum.trackDetails("Leadership Foundations"),
    ).toContainText("Key: leadership");
    expect(await curriculum.moduleTitles("Leadership Foundations")).toEqual([
      "1. Knowing Yourself",
      "2. Leading by Serving",
      "3. Speaking Up",
    ]);
    await expect(
      curriculum.moduleRow("Leadership Foundations", "Leading by Serving"),
    ).toContainText("In review");
    await expect(curriculum.moveUp("Knowing Yourself")).toBeDisabled();
    await expect(curriculum.moveDown("Speaking Up")).toBeDisabled();
    await curriculum.expectAccessible();
  });

  test("Given the new-track dialog, when Marisol creates Art Club with no key, then it is a draft keyed art-club and a toast confirms", async ({
    page,
  }) => {
    const curriculum = new CurriculumPage(page);
    await curriculum.openLoaded();

    await curriculum.newTrack({
      name: "Art Club",
      description: "Drawing and painting together.",
    });
    await curriculum.expectAccessible();
    await curriculum.submitDialog("Create track");

    await expect(curriculum.dialog).toBeHidden();
    await expect(curriculum.toast).toContainText("Track created");
    await expect(curriculum.trackStatus("Art Club")).toHaveText("Draft");
    await expect(curriculum.trackDetails("Art Club")).toContainText(
      "Key: art-club",
    );
    await expect(curriculum.stat("tracks")).toHaveText("3");
  });

  test("Given a key another track uses, when Marisol creates the track, then the dialog shows the error and nothing is added", async ({
    page,
  }) => {
    const curriculum = new CurriculumPage(page);
    await curriculum.openLoaded();

    await curriculum.newTrack({ name: "Leaders", key: "leadership" });
    await curriculum.submitDialog("Create track");

    await expect(curriculum.dialogError("key")).toHaveText(
      "Another track already uses this key.",
    );
    await curriculum.expectAccessible();
    await expect(curriculum.stat("tracks")).toHaveText("2");
  });

  test("Given Leadership Foundations, when Marisol adds a module, then the module editor opens on it and it is listed last as a draft", async ({
    page,
  }) => {
    const curriculum = new CurriculumPage(page);
    const editor = new CurriculumModulePage(page);
    await curriculum.openLoaded();

    await curriculum.newModule("Leadership Foundations", "Finding Your Voice");
    await curriculum.submitDialog("Create and edit");

    await editor.expectOpen("Finding Your Voice");
    await expect(editor.subtitle).toHaveText(
      "Module 4 of 4 in Leadership Foundations",
    );
    await editor.backToCurriculum();
    expect(await curriculum.moduleTitles("Leadership Foundations")).toEqual([
      "1. Knowing Yourself",
      "2. Leading by Serving",
      "3. Speaking Up",
      "4. Finding Your Voice",
    ]);
  });

  test("Given three modules, when Marisol moves Speaking Up up, then the new order shows and survives a reload", async ({
    page,
  }) => {
    const curriculum = new CurriculumPage(page);
    await curriculum.openLoaded();

    await curriculum.moveUp("Speaking Up").click();

    await expect
      .poll(() => curriculum.moduleTitles("Leadership Foundations"))
      .toEqual([
        "1. Knowing Yourself",
        "2. Speaking Up",
        "3. Leading by Serving",
      ]);
    await expect(curriculum.moveUp("Speaking Up")).toBeFocused();
    await curriculum.openLoaded();
    expect(await curriculum.moduleTitles("Leadership Foundations")).toEqual([
      "1. Knowing Yourself",
      "2. Speaking Up",
      "3. Leading by Serving",
    ]);
  });

  test("Given the module editor, when Marisol saves the details, then a toast confirms and the values stay after a reload", async ({
    page,
  }) => {
    const curriculum = new CurriculumPage(page);
    const editor = new CurriculumModulePage(page);
    await curriculum.openLoaded();
    await curriculum.openModule("Leadership Foundations", "Speaking Up");
    await editor.expectOpen("Speaking Up");
    await editor.expectAccessible();

    await editor.description.fill(
      "Finding your voice and using it for others.",
    );
    await editor.prerequisite.selectOption({ label: "Leading by Serving" });
    await editor.anchor.fill("“Speak up for those who can’t.”");
    await editor.save();

    await expect(editor.toast).toContainText("Module saved");
    await page.reload();
    await editor.expectOpen("Speaking Up");
    await expect(editor.description).toHaveValue(
      "Finding your voice and using it for others.",
    );
    await expect(editor.prerequisite.locator("option:checked")).toHaveText(
      "Leading by Serving",
    );
    await expect(editor.anchor).toHaveValue("“Speak up for those who can’t.”");
  });

  test("Given the module editor, when Marisol saves with no name, then the error shows beside the field and in the summary", async ({
    page,
  }) => {
    const editor = new CurriculumModulePage(page);
    await editor.open("cm-serving");
    await editor.expectOpen("Leading by Serving");

    await editor.name.fill("");
    await editor.save();

    await expect(editor.fieldError("name")).toHaveText(
      "Give the module a name.",
    );
    await expect(editor.errorSummary).toBeFocused();
    await editor.expectAccessible();
  });

  test("Given the save fails, when Marisol saves the module, then the inputs are kept and an alert offers a retry", async ({
    page,
    api,
  }) => {
    const editor = new CurriculumModulePage(page);
    await editor.open("cm-serving");
    await editor.expectOpen("Leading by Serving");
    api.failNext("/api/curriculum/modules/cm-serving", 500);

    await editor.description.fill("Changed");
    await editor.save();

    await expect(editor.failedAlert).toBeVisible();
    await expect(editor.description).toHaveValue("Changed");
  });

  test("Given an unknown module, when it is opened, then the page says it can’t be found", async ({
    page,
  }) => {
    const editor = new CurriculumModulePage(page);

    await editor.open("cm-unknown");

    await expect(editor.notFound).toBeVisible();
    await editor.expectAccessible();
  });

  test("Given the curriculum fails to load, when Marisol opens it, then the error state offers Try again", async ({
    page,
    api,
  }) => {
    const curriculum = new CurriculumPage(page);
    api.failNext("/api/curriculum", 500);

    await curriculum.open();

    await expect(curriculum.errorState).toBeVisible();
    await curriculum.expectAccessible();
  });

  test("Given Learning is off, when a module editor is opened directly, then Today opens and the module endpoint answers 404", async ({
    page,
    api,
  }) => {
    api.setModules(
      "org-harbourview",
      ON.filter((m) => m !== "Learning"),
    );
    const editor = new CurriculumModulePage(page);
    const curriculum = new CurriculumPage(page);

    await editor.open("cm-serving");

    await expect(page).toHaveURL(/\/$/);
    expect(
      await curriculum.apiStatus("/api/curriculum/modules/cm-serving"),
    ).toBe(404);
  });

  test("Given a phone, when Marisol opens Curriculum and a module, then nothing scrolls sideways", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const curriculum = new CurriculumPage(page);
    const editor = new CurriculumModulePage(page);

    await curriculum.openLoaded();
    await curriculum.expectNoHorizontalScroll();
    await curriculum.openModule("Leadership Foundations", "Leading by Serving");
    await editor.expectOpen("Leading by Serving");
    await editor.expectNoHorizontalScroll();
    await editor.expectAccessible();
  });
});

test.describe("Curriculum at another organization", () => {
  test.use({ signedInAs: "m-grace" });

  test("Given Learning is on at Northgate, when Grace opens Curriculum, then no Harbourview track shows and a Harbourview module answers 404", async ({
    page,
    api,
  }) => {
    api.setModules("org-northgate", [
      "Roster",
      "RollCall",
      "QuickCards",
      "Learning",
    ]);
    const curriculum = new CurriculumPage(page);

    await curriculum.openLoaded();

    await expect(curriculum.emptyState).toBeVisible();
    expect(
      await curriculum.apiStatus("/api/curriculum/modules/cm-serving"),
    ).toBe(404);
  });
});
