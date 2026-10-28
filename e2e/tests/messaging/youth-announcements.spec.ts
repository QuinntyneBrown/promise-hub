import { test, expect } from "../../fixtures/test";
import type { FakeApi } from "../../fixtures/fake-api";
import type { ModuleId } from "../../fixtures/seed";
import { ShellPage } from "../../pages/shell.page";
import { TodayPage } from "../../pages/today.page";
import { YouthAnnouncementsPage } from "../../pages/youth-announcements.page";

// Acceptance test. Traces to: L2-105 criteria 5, 6, 8 and 9 (a youth and a mentor read the announcements aimed at them, newest first with
// who sent them, New badges, Mark all read and its failure, the empty and failed states, Messages off), L2-035, L2-036.
const ALL: ModuleId[] = [
  "Roster",
  "Slips",
  "RollCall",
  "QuickCards",
  "Pickup",
  "Messages",
  "Incidents",
  "Reports",
  "Learning",
  "Mentoring",
];

function seed(api: FakeApi): void {
  api.announcements.seed({
    title: "Welcome to Learning",
    body: "Your lessons, badges and journey are in Learning.",
    programId: null,
    program: null,
    audience: "Everyone",
    sendAt: "2026-10-19T13:00:00Z",
    sentBy: "Tom Nguyen",
    sentByRole: "Admin",
  });
  api.announcements.seed({
    title: "Tutoring night moves to Room 2",
    body: "Same time, 4:00 pm.",
    programId: "p-tutoring",
    program: "After-School Tutoring",
    audience: "Youth",
    sendAt: "2026-11-02T14:00:00Z",
    sentBy: "Marisol Delgado",
  });
  api.announcements.seed({
    title: "Mentor huddle moved to Thursday 7 pm",
    body: "Room 3.",
    programId: null,
    program: null,
    audience: "Mentors",
    sendAt: "2026-10-30T15:00:00Z",
    sentBy: "Marisol Delgado",
  });
  api.announcements.seed({
    title: "Saturday Sports field day",
    body: "Wear running shoes.",
    programId: null,
    program: null,
    audience: "Everyone",
    sendAt: "2026-11-06T14:00:00Z",
    sentBy: "Marisol Delgado",
  });
}

test.describe("Announcements for a youth", () => {
  test.use({ signedInAs: "m-sofia" });

  test.beforeEach(({ api }) => api.setModules("org-harbourview", ALL));

  test("Given announcements aimed at her, when Sofía opens Announcements from the menu, then she reads them newest first, the unread marked New", async ({
    page,
    api,
  }) => {
    seed(api);
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    const announcements = new YouthAnnouncementsPage(page);

    await today.open();
    await shell.openMenu();
    await shell.goToFromMenu("Announcements");

    await expect(announcements.heading).toHaveText("Announcements");
    expect(await announcements.titles()).toEqual([
      "Tutoring night moves to Room 2",
      "Welcome to Learning",
    ]);
    await expect(
      announcements.item("Tutoring night moves to Room 2"),
    ).toContainText("Marisol Delgado · Program director");
    await expect(announcements.newBadges).toHaveCount(2);
    await announcements.expectAccessible();
  });

  test("Given unread announcements, when she marks all read, then the badges go and a toast says she is caught up", async ({
    page,
    api,
  }) => {
    seed(api);
    const announcements = new YouthAnnouncementsPage(page);
    await announcements.open();

    await announcements.markAllRead.click();

    await expect(announcements.toast("All caught up")).toBeVisible();
    await expect(announcements.newBadges).toHaveCount(0);
    await expect(announcements.markAllRead).toBeHidden();
    await announcements.expectAccessible();
  });

  test("Given Mark all read fails, then she is told and the New badges stay", async ({
    page,
    api,
  }) => {
    seed(api);
    api.announcements.failMarkRead = true;
    const announcements = new YouthAnnouncementsPage(page);
    await announcements.open();

    await announcements.markAllRead.click();

    await expect(announcements.markFailed).toBeVisible();
    await expect(announcements.newBadges).toHaveCount(2);
  });

  test("Given nothing aimed at her, then she is told where news will show", async ({
    page,
  }) => {
    const announcements = new YouthAnnouncementsPage(page);
    await announcements.open();

    await expect(announcements.emptyState).toBeVisible();
    await announcements.expectAccessible();
  });

  test("Given the list fails to load, then it offers Try again", async ({
    page,
  }) => {
    await page.route("**/api/announcements/mine", (route) =>
      route.fulfill({ status: 500 }),
    );
    const announcements = new YouthAnnouncementsPage(page);
    await announcements.open();

    await expect(announcements.failed).toBeVisible();
  });

  test("Given a phone, then the announcements fit without sideways scrolling", async ({
    page,
    api,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    seed(api);
    const announcements = new YouthAnnouncementsPage(page);
    await announcements.open();

    await expect(announcements.item("Welcome to Learning")).toBeVisible();
    await announcements.expectNoHorizontalScroll();
  });

  test("Given Messages off, then Announcements is not in her menu, the route goes to Today and the API answers 404", async ({
    page,
    api,
  }) => {
    api.setModules(
      "org-harbourview",
      ALL.filter((m) => m !== "Messages"),
    );
    const shell = new ShellPage(page);
    const today = new TodayPage(page);
    const announcements = new YouthAnnouncementsPage(page);

    await page.goto("/announcements");

    await expect(page).toHaveURL(/\/$/);
    await expect(today.heading).toBeVisible();
    await shell.openMenu();
    expect(await shell.menuLabels()).not.toContain("Announcements");
    expect(await announcements.apiStatus()).toBe(404);
  });
});

test.describe("Announcements for a mentor", () => {
  test.use({ signedInAs: "m-daniel" });

  test("Given the mentor huddle, when Daniel opens Announcements, then he reads those for mentors and everyone, never the youth ones", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", ALL);
    seed(api);
    const announcements = new YouthAnnouncementsPage(page);

    await announcements.open();

    expect(await announcements.titles()).toEqual([
      "Mentor huddle moved to Thursday 7 pm",
      "Welcome to Learning",
    ]);
    await announcements.expectAccessible();
  });
});

test.describe("Announcements for staff", () => {
  test.use({ signedInAs: "m-jaylen" });

  test("Given a site lead, then her own feed is refused by the server", async ({
    page,
  }) => {
    const announcements = new YouthAnnouncementsPage(page);
    await page.goto("/");
    expect(await announcements.apiStatus()).toBe(403);
  });
});
