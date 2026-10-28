import { test, expect } from "../../fixtures/test";
import { AnnouncementsPage } from "../../pages/announcements.page";
import { ComposeAnnouncementDialog } from "../../pages/compose-announcement.page";
import { GuardianAnnouncementsPage } from "../../pages/guardian-announcements.page";
import { MessagesPage } from "../../pages/messages.page";
import { TodayPage } from "../../pages/today.page";

// Acceptance test. Traces to: L2-105 criteria 1, 2, 3, 4, 7, 8 and 9 (Marisol composes an announcement to a program now or later, field
// errors, the guardians' copy through Messages, the staff list with reach and reads, the empty, failed and forbidden states, Messages off),
// L2-021, L2-022, L2-035, L2-036.
const ROOM =
  "Tutoring night is in Room 2 this Thursday while the gym floor is redone. Same time, 4:00 pm.";

test.describe("Announcements for a program director", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given nothing announced, when Marisol opens Announcements from Messages, then it offers a new announcement", async ({
    page,
  }) => {
    const messages = new MessagesPage(page);
    const announcements = new AnnouncementsPage(page);

    await messages.open();
    await announcements.openFromMessages();

    await expect(announcements.emptyState).toBeVisible();
    await announcements.expectAccessible();
  });

  test("Given the dialog, when she sends Room 2 to Tutoring youth now, then a toast says so and it tops the list unread", async ({
    page,
    api,
  }) => {
    const announcements = new AnnouncementsPage(page);
    const compose = new ComposeAnnouncementDialog(page);
    await announcements.open();

    await announcements.newAnnouncement();
    await compose.expectOpen();
    await compose.expectAccessible();
    await compose.fill({
      title: "Tutoring night moves to Room 2",
      body: ROOM,
      program: "After-School Tutoring",
      audience: "Youth",
    });
    await compose.send();

    await expect(compose.dialog).toBeHidden();
    await expect(announcements.toast("Announcement sent")).toBeVisible();
    const row = announcements.row("Tutoring night moves to Room 2");
    await expect(row).toContainText("After-School Tutoring · Youth");
    await expect(row).toContainText(ROOM);
    await expect(row).toContainText("Read by 0 of 1");
    expect(api.auditOf("Announcement")).toHaveLength(1);
    await announcements.expectAccessible();
  });

  test("Given Youth and guardians, when sent, then the households get it as a Messages message the guardian pages list", async ({
    page,
    api,
  }) => {
    const announcements = new AnnouncementsPage(page);
    const compose = new ComposeAnnouncementDialog(page);
    await announcements.open();

    await announcements.newAnnouncement();
    await compose.fill({
      title: "Gardens trip: sign-ups close Friday",
      body: "Sign up for the trip by Friday.",
      program: "After-School Tutoring",
      audience: "Youth and guardians",
    });
    await compose.send();

    await expect(
      announcements.row("Gardens trip: sign-ups close Friday"),
    ).toContainText("households texted");
    api.setHouseholdLanguage("hh-rivera", "English");
    api.trustGuardianDevice("hh-rivera");
    const guardian = new GuardianAnnouncementsPage(page);
    await guardian.open("tok-home-rivera");
    await expect(
      guardian.item("Gardens trip: sign-ups close Friday"),
    ).toBeVisible();
  });

  test("Given Schedule for later, when scheduled for tomorrow, then it is listed as Scheduled with its time", async ({
    page,
  }) => {
    const announcements = new AnnouncementsPage(page);
    const compose = new ComposeAnnouncementDialog(page);
    await announcements.open();

    await announcements.newAnnouncement();
    await compose.fill({
      title: "Saturday Sports field day",
      body: "Wear running shoes.",
      program: "Saturday Sports",
      audience: "Everyone",
      later: { date: "2026-11-06", time: "09:00" },
    });
    await compose.send();

    await expect(announcements.toast("Announcement scheduled")).toBeVisible();
    await expect(announcements.row("Saturday Sports field day")).toContainText(
      "Scheduled",
    );
    await expect(announcements.row("Saturday Sports field day")).toContainText(
      "Sends Fri 6 Nov",
    );
  });

  test("Given nothing filled in, when sent, then each field says what is missing and nothing is announced", async ({
    page,
    api,
  }) => {
    const announcements = new AnnouncementsPage(page);
    const compose = new ComposeAnnouncementDialog(page);
    await announcements.open();

    await announcements.newAnnouncement();
    await compose.send();

    await expect(compose.summary).toBeVisible();
    await expect(compose.error("Give it a title.")).toBeVisible();
    await expect(compose.error("Write the announcement.")).toBeVisible();
    await expect(compose.error("Choose who hears it.")).toBeVisible();
    await compose.expectAccessible();
    expect(api.announcements.rows).toHaveLength(0);
  });

  test("Given the send fails, then the dialog says so and keeps what she wrote", async ({
    page,
    api,
  }) => {
    api.announcements.failCompose = true;
    const announcements = new AnnouncementsPage(page);
    const compose = new ComposeAnnouncementDialog(page);
    await announcements.open();

    await announcements.newAnnouncement();
    await compose.fill({ title: "Room 2", body: ROOM, audience: "Youth" });
    await compose.send();

    await expect(compose.failed).toBeVisible();
    await expect(compose.field("Title")).toHaveValue("Room 2");
  });

  test("Given the list fails to load, then it offers Try again", async ({
    page,
  }) => {
    await page.route("**/api/announcements", (route) =>
      route.fulfill({ status: 500 }),
    );
    const announcements = new AnnouncementsPage(page);
    await announcements.open();

    await expect(announcements.failed).toBeVisible();
    await announcements.expectAccessible();
  });

  test("Given a phone, then the list and the dialog fit without sideways scrolling", async ({
    page,
    api,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    api.announcements.seed({
      title: "Mentor huddle moved to Thursday 7 pm",
      body: "Room 3.",
      programId: null,
      program: null,
      audience: "Mentors",
      sendAt: "2026-10-30T15:00:00Z",
      sentBy: "Marisol Delgado",
    });
    const announcements = new AnnouncementsPage(page);
    const compose = new ComposeAnnouncementDialog(page);
    await announcements.open();

    await expect(
      announcements.row("Mentor huddle moved to Thursday 7 pm"),
    ).toBeVisible();
    await announcements.expectNoHorizontalScroll();
    await announcements.newAnnouncement();
    await compose.expectOpen();
    await compose.expectNoHorizontalScroll();
  });
});

test.describe("Announcements for other roles", () => {
  test.use({ signedInAs: "m-aisha" });

  test("Given a youth worker, when she opens Announcements, then the server refuses and she is told who sends them", async ({
    page,
  }) => {
    const announcements = new AnnouncementsPage(page);
    await announcements.open();

    await expect(announcements.forbidden).toBeVisible();
    await announcements.expectAccessible();
  });
});

test.describe("Announcements with Messages off", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given Messages off, then the route goes to Today and the API answers 404", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", ["Roster", "RollCall"]);
    const today = new TodayPage(page);
    const compose = new ComposeAnnouncementDialog(page);

    await page.goto("/messages/announcements");

    await expect(page).toHaveURL(/\/$/);
    await expect(today.heading).toBeVisible();
    expect(await compose.apiStatus()).toBe(404);
  });
});
