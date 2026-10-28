import { test, expect } from "../../fixtures/test";
import type { FakeApi } from "../../fixtures/fake-api";
import type { ModuleId } from "../../fixtures/seed";
import { NotificationsPage } from "../../pages/notifications.page";
import { ConversationPage } from "../../pages/conversation.page";
import { ShellPage } from "../../pages/shell.page";

// Acceptance test. Traces to: L2-110 criteria 1, 3 and 4 (a new notice reaches the open center and the bell without a reload, a read on
// another device drops the count), L2-109 criteria 2 to 5 and 7 (a youth's and a mentor's own notices from Learning, Mentoring and Messages, New
// on the unread, opening one reads it and follows its link, kinds of a module that is off hidden, axe and no sideways scroll), L2-040,
// L2-005.
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

function setUp(api: FakeApi): void {
  api.setModules("org-harbourview", ALL);
  api.assignYouthMentor("c-sofia", "m-daniel");
  api.giveConsent("c-sofia");
}

function announce(api: FakeApi): void {
  api.announceNow({
    title: "Tutoring night moves to Room 2",
    body: "Same time, 4:00 pm.",
    programId: "p-tutoring",
    program: "After-School Tutoring",
    audience: "Youth",
    sendAt: "2026-11-05T21:00:00Z",
    sentBy: "Marisol Delgado",
  });
}

test.describe("Receive notifications as a youth", () => {
  test.use({ signedInAs: "m-sofia" });

  test("Given a message, an announcement and a badge, when Sofía opens her center, then each is listed with its kind and the unread are new", async ({
    page,
    api,
  }) => {
    setUp(api);
    api.seedNotification({
      membershipId: "m-sofia",
      kind: "learning",
      text: "You earned the Faithful Five badge.",
      link: "/learning",
      readAt: "2026-11-02T22:00:00Z",
    });
    announce(api);
    api.writeAs("m-daniel", "m-sofia", "Bring your reflection too.");
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.subtitle).toHaveText("2 unread");
    await expect(center.item("New message from Daniel Osei")).toContainText(
      "Message",
    );
    await expect(
      center.item(
        "Marisol Delgado posted an announcement: Tutoring night moves to Room 2",
      ),
    ).toContainText("Announcement");
    await expect(
      center.item("You earned the Faithful Five badge."),
    ).toContainText("Learning");
    await expect(center.newBadges).toHaveCount(2);
    await expect(center.item("New message from Daniel Osei")).not.toContainText(
      "Bring your reflection",
    );
    await center.expectAccessible();
    await center.expectNoHorizontalScroll();
  });

  test("Given a message notice, when she opens it, then it is read and her conversation opens", async ({
    page,
    api,
  }) => {
    setUp(api);
    api.writeAs("m-daniel", "m-sofia", "Bring your reflection too.");
    const center = new NotificationsPage(page);
    await center.open();

    await center.openItem("New message from Daniel Osei");

    await expect(
      new ConversationPage(page).message("Bring your reflection too."),
    ).toBeVisible();
    await expect(new ShellPage(page).bell).toHaveAccessibleName(
      "Notifications",
    );
  });

  test("Given Messages is off, when she opens her center, then message and announcement notices are hidden and the rest stay", async ({
    page,
    api,
  }) => {
    setUp(api);
    api.seedNotification({
      membershipId: "m-sofia",
      kind: "assignments",
      text: "Daniel Osei assigned you the Last in Line lesson, due Fri 13 Nov.",
      link: "/learning",
    });
    announce(api);
    api.writeAs("m-daniel", "m-sofia", "Bring your reflection too.");
    api.setModules(
      "org-harbourview",
      ALL.filter((m) => m !== "Messages"),
    );
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.items()).toHaveCount(1);
    await expect(
      center.item(
        "Daniel Osei assigned you the Last in Line lesson, due Fri 13 Nov.",
      ),
    ).toContainText("Assigned work");
    await expect(center.subtitle).toHaveText("1 unread");
  });

  test("Given nothing yet, when she opens her center, then she is all caught up", async ({
    page,
    api,
  }) => {
    setUp(api);
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.empty).toBeVisible();
    await center.expectAccessible();
  });
});

test.describe("Receive notifications in real time", () => {
  test.use({ signedInAs: "m-sofia" });

  test("Given Sofía has her center open, when Daniel writes, then his notice appears on top with New and the bell counts it, without a reload", async ({
    page,
    api,
  }) => {
    setUp(api);
    api.seedNotification({
      membershipId: "m-sofia",
      kind: "learning",
      text: "You earned the Faithful Five badge.",
      link: "/learning",
      readAt: "2026-11-02T22:00:00Z",
    });
    const center = new NotificationsPage(page);
    const shell = new ShellPage(page);
    await center.open();
    await expect(center.subtitle).toHaveText("All read");

    api.writeAs("m-daniel", "m-sofia", "Bring your reflection too.");

    await expect(center.items().first()).toContainText(
      "New message from Daniel Osei",
    );
    await expect(center.newBadges).toHaveCount(1);
    await expect(center.subtitle).toHaveText("1 unread");
    await expect(shell.bell).toHaveAccessibleName("Notifications, 1 unread");
    await expect(center.items()).toHaveCount(2);
  });

  test("Given Sofía is on Today, when an announcement reaches her, then the bell counts it without a reload", async ({
    page,
    api,
  }) => {
    setUp(api);
    const shell = new ShellPage(page);
    await page.goto("/");
    await expect(shell.bell).toHaveAccessibleName("Notifications");

    announce(api);

    await expect(shell.bell).toHaveAccessibleName("Notifications, 1 unread");
  });

  test("Given an unread notice, when she reads it on another device, then the bell here drops without a reload", async ({
    page,
    api,
  }) => {
    setUp(api);
    api.writeAs("m-daniel", "m-sofia", "Bring your reflection too.");
    const shell = new ShellPage(page);
    await page.goto("/");
    await expect(shell.bell).toHaveAccessibleName("Notifications, 1 unread");

    api.readAllNotificationsAs("m-sofia");

    await expect(shell.bell).toHaveAccessibleName("Notifications");
  });
});

test.describe("Receive notifications as a mentor", () => {
  test.use({ signedInAs: "m-daniel" });

  test("Given Sofía wrote to him, when Daniel opens his center, then her message notice is there and his own sends are not", async ({
    page,
    api,
  }) => {
    setUp(api);
    api.writeAs("m-daniel", "m-sofia", "Room 2 at 4:00.");
    api.writeAs("m-sofia", "m-sofia", "See you there!");
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.items()).toHaveCount(1);
    await expect(center.item("New message from Sofía Rivera")).toBeVisible();
    await center.expectAccessible();
  });
});
