import { test, expect } from "../../fixtures/test";
import type { FakeApi } from "../../fixtures/fake-api";
import type { ModuleId } from "../../fixtures/seed";
import { NotificationPreferencesPage } from "../../pages/notification-preferences.page";
import { NotificationsPage } from "../../pages/notifications.page";
import { AccountPage } from "../../pages/account.page";

// Acceptance test. Traces to: L2-111 criteria 1, 2, 3, 5 and 6 (the kinds a member's role receives whose modules are on, all on until
// changed; a kind turned off stops its notices; Messages off hides its choices; a failed save keeps the choices; axe and no sideways
// scroll), L2-109.
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

test.describe("Choose notifications as a youth", () => {
  test.use({ signedInAs: "m-sofia" });

  test("Given her center, when Sofía opens Settings, then each kind she receives is offered and on", async ({
    page,
    api,
  }) => {
    setUp(api);
    const center = new NotificationsPage(page);
    const preferences = new NotificationPreferencesPage(page);
    await center.open();

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(preferences.heading).toBeVisible();
    await expect(preferences.switches).toHaveCount(4);
    for (const name of [
      "Grades and badges",
      "Assigned work",
      "Messages",
      "Announcements",
    ])
      await expect(preferences.choice(name)).toBeChecked();
    await expect(
      page.getByText(
        "When your mentor assigns you a lesson, quiz or assignment.",
      ),
    ).toBeVisible();
    await preferences.expectAccessible();
    await preferences.expectNoHorizontalScroll();
  });

  test("Given she turns Announcements off and saves, then it is saved and the next announcement does not notify her", async ({
    page,
    api,
  }) => {
    setUp(api);
    const preferences = new NotificationPreferencesPage(page);
    await preferences.open();

    await preferences.choice("Announcements").uncheck();
    await preferences.save();

    await expect(preferences.saved).toBeVisible();
    await preferences.expectAccessible();
    await preferences.open();
    await expect(preferences.choice("Announcements")).not.toBeChecked();
    api.announceNow({
      title: "Tutoring night moves to Room 2",
      body: "Same time, 4:00 pm.",
      programId: "p-tutoring",
      program: "After-School Tutoring",
      audience: "Youth",
      sendAt: "2026-11-05T21:00:00Z",
      sentBy: "Marisol Delgado",
    });
    const center = new NotificationsPage(page);
    await center.open();
    await expect(center.empty).toBeVisible();
  });

  test("Given Messages is off, when she opens her preferences, then Messages and Announcements are not offered", async ({
    page,
    api,
  }) => {
    setUp(api);
    api.setModules(
      "org-harbourview",
      ALL.filter((m) => m !== "Messages"),
    );
    const preferences = new NotificationPreferencesPage(page);

    await preferences.open();

    await expect(preferences.switches).toHaveCount(2);
    await expect(preferences.choice("Messages")).toHaveCount(0);
    await expect(preferences.choice("Announcements")).toHaveCount(0);
  });

  test("Given the save fails, then the page says so and her choice is kept", async ({
    page,
    api,
  }) => {
    setUp(api);
    const preferences = new NotificationPreferencesPage(page);
    await preferences.open();
    await preferences.choice("Messages").uncheck();
    api.failNext("/api/notifications/preferences", 500);

    await preferences.save();

    await expect(preferences.failed).toBeVisible();
    await expect(preferences.choice("Messages")).not.toBeChecked();
    await preferences.expectAccessible();
  });

  test("Given the preferences fail to load, then Try again loads them", async ({
    page,
    api,
  }) => {
    setUp(api);
    await page.goto("/");
    api.failNext("/api/notifications/preferences", 500);
    const preferences = new NotificationPreferencesPage(page);

    await page.goto("/account/notifications");

    await expect(preferences.loadError).toBeVisible();
    api.recover("/api/notifications/preferences");
    await preferences.tryAgain();
    await expect(preferences.switches).toHaveCount(4);
  });
});

test.describe("Choose notifications as a mentor", () => {
  test.use({ signedInAs: "m-daniel" });

  test("Given Daniel opens his preferences from his account, then Messages and Announcements are offered", async ({
    page,
    api,
  }) => {
    setUp(api);
    const account = new AccountPage(page);
    await account.open();

    await page.getByRole("link", { name: "Choose notifications" }).click();

    const preferences = new NotificationPreferencesPage(page);
    await expect(preferences.heading).toBeVisible();
    await expect(preferences.switches).toHaveCount(2);
    await expect(preferences.choice("Messages")).toBeChecked();
  });
});

test.describe("Choose notifications as a program director", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given Marisol opens her preferences, then the kinds her role reviews are offered", async ({
    page,
    api,
  }) => {
    setUp(api);
    const preferences = new NotificationPreferencesPage(page);

    await preferences.open();

    await expect(preferences.switches).toHaveCount(4);
    await expect(preferences.choice("Incidents to review")).toBeChecked();
    await expect(preferences.choice("At-risk flags")).toBeChecked();
    await expect(preferences.choice("Family data requests")).toBeChecked();
    await expect(preferences.choice("Learning Bond agreement")).toBeChecked();
  });
});

test.describe("Choose notifications as a volunteer", () => {
  test.use({ signedInAs: "m-leo" });

  test("Given Leo receives none of these kinds, then the page says there is nothing to choose", async ({
    page,
    api,
  }) => {
    setUp(api);
    const preferences = new NotificationPreferencesPage(page);

    await preferences.open();

    await expect(preferences.empty).toBeVisible();
    await preferences.expectAccessible();
  });
});
