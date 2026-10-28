import { test, expect } from "../../fixtures/test";
import { NotificationsPage } from "../../pages/notifications.page";
import { ShellPage } from "../../pages/shell.page";

// L2-040 in-app notifications, L2-005 modules off, L2-001 tenants, L2-036 layout.
test.describe("Review notifications as a program director", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given two incidents reported, when Today loads, then the bell shows 2 and opens the center newest first", async ({
    page,
    api,
  }) => {
    api.reportIncident("m-aisha", "Injury", "c-mateo");
    api.reportIncident("m-aisha", "Behaviour", "c-sofia");
    const shell = new ShellPage(page);
    const center = new NotificationsPage(page);
    await page.goto("/");

    await expect(shell.bell).toHaveAccessibleName("Notifications, 2 unread");
    await shell.openNotifications();

    await expect(center.heading).toBeVisible();
    await expect(center.subtitle).toHaveText("2 unread");
    await expect(center.items().first()).toContainText("Sofía Rivera");
    await center.expectAccessible();
    await center.expectNoHorizontalScroll();
  });

  test("Given an unread notice, when it is opened, then it is read, the count drops and the report opens", async ({
    page,
    api,
  }) => {
    api.reportIncident("m-aisha", "Injury", "c-mateo");
    const shell = new ShellPage(page);
    const center = new NotificationsPage(page);
    await center.open();

    await center.openItem(/Mateo Rivera/);

    await expect(page).toHaveURL(/\/incidents\/inc-/);
    await expect(shell.bell).toHaveAccessibleName("Notifications");
  });

  test("Given unread notices, when Mark all read is chosen, then all are read", async ({
    page,
    api,
  }) => {
    api.reportIncident("m-aisha", "Injury", "c-mateo");
    api.reportIncident("m-aisha", "Behaviour", "c-sofia");
    const center = new NotificationsPage(page);
    await center.open();

    await center.markAllRead();

    await expect(center.subtitle).toHaveText("All read");
    await expect(new ShellPage(page).bell).toHaveAccessibleName(
      "Notifications",
    );
  });

  test("Given nothing yet, when the center opens, then it says all caught up", async ({
    page,
  }) => {
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.empty).toBeVisible();
    await center.expectAccessible();
  });

  test("Given the center fails, when it opens, then it offers to try again", async ({
    page,
    api,
  }) => {
    const center = new NotificationsPage(page);
    await page.goto("/");
    api.failNext("/api/notifications", 500);

    await page.goto("/notifications");

    await expect(
      page.getByRole("heading", { name: "We couldn’t load notifications" }),
    ).toBeVisible();
  });

  test("Given Incidents is off, when the center opens, then incident notices are hidden", async ({
    page,
    api,
  }) => {
    api.reportIncident("m-aisha", "Injury", "c-mateo");
    api.setModules("org-harbourview", ["Roster"]);
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.empty).toBeVisible();
  });
});

test.describe("Youth worker", () => {
  test.use({ signedInAs: "m-aisha" });

  test("Given she reported an incident, when her center opens, then she has no review notice", async ({
    page,
    api,
  }) => {
    api.reportIncident("m-aisha", "Injury", "c-mateo");
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.empty).toBeVisible();
  });
});

test.describe("Another organization", () => {
  test.use({ signedInAs: "m-grace" });

  test("Given a Harbourview incident, when Grace opens her center, then she sees none of it", async ({
    page,
    api,
  }) => {
    api.reportIncident("m-aisha", "Injury", "c-mateo");
    const center = new NotificationsPage(page);

    await center.open();

    await expect(center.empty).toBeVisible();
  });
});
