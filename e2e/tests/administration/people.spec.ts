import { test, expect } from "../../fixtures/test";
import { PeoplePage } from "../../pages/people.page";
import { ShellPage } from "../../pages/shell.page";

// Acceptance Test
// Traces to: L2-112, L2-114, L2-001, L2-005, L2-035, L2-036
// Description: an admin finds every account of the organization in the people directory, searches, filters and pages through it;
// Mentoring adds its column and filter only while it is on; everyone else is refused.
test.describe("The people directory for an admin", () => {
  test.use({ signedInAs: "m-tom" });

  test("Given Harbourview, when Tom opens People from the menu, then every account is listed by name with role, programs, mentor and status", async ({
    page,
    api,
  }) => {
    api.assignYouthMentor("c-sofia", "m-daniel");
    const shell = new ShellPage(page);
    const people = new PeoplePage(page);
    await page.goto("/");
    await shell.openMenu();
    await shell.goToFromMenu("People");

    await expect(people.heading).toHaveText("People");
    await expect
      .poll(() => people.names())
      .toEqual([
        "Aisha Bello",
        "Daniel Osei",
        "Hana Kim",
        "Jaylen Okafor",
        "Leo Martins",
        "Marisol Delgado",
        "Nadia Haddad",
        "Priya Raman",
        "Sofía Rivera",
        "Tom Nguyen",
      ]);
    await expect(people.row("Sofía Rivera")).toContainText("Youth");
    await expect(people.row("Sofía Rivera")).toContainText("Active");
    if (!people.isPhone) {
      await expect(people.row("Sofía Rivera")).toContainText(
        "After-School Tutoring",
      );
      await expect(people.row("Sofía Rivera")).toContainText("Daniel Osei");
    }
    await expect(people.row("Tom Nguyen")).toContainText("(you)");
    await expect(people.pagination).toContainText("Showing 1–10 of 10");
    await people.expectAccessible();
    await people.expectNoHorizontalScroll();
  });

  test("Given the directory, when Tom filters to mentors and searches for someone who is not there, then the server narrows it and the page says so", async ({
    page,
  }) => {
    const people = new PeoplePage(page);
    await people.open();

    await people.filterRole("Mentor");
    await expect
      .poll(() => people.names())
      .toEqual(["Daniel Osei", "Hana Kim"]);
    await people.filterRole("All roles");
    await people.filterProgram("After-School Tutoring");
    await expect.poll(() => people.names()).toEqual(["Sofía Rivera"]);
    await people.filterProgram("All programs");

    await people.search("Petrov");
    await expect(people.emptyState).toContainText("No one matches “Petrov”");
    await expect(
      people.page.getByRole("button", { name: "Invite staff" }),
    ).toHaveCount(2);
    await people.expectAccessible();
    await people.clearSearch();
    await expect.poll(() => people.names()).toHaveLength(10);
  });

  test("Given 40 people, when Tom moves to the next page, then the next 15 are shown with their range", async ({
    page,
    api,
  }) => {
    api.addPeople(30);
    const people = new PeoplePage(page);
    await people.open();

    await expect(people.pagination).toContainText("Showing 1–25 of 40");
    await expect.poll(() => people.names()).toHaveLength(25);
    await people.nextPage();

    await expect(people.pagination).toContainText("Showing 26–40 of 40");
    await expect.poll(() => people.names()).toHaveLength(15);
    await people.expectAccessible();
  });

  test("Given Mentoring is off, when Tom opens People, then there is no Mentor column or Mentor filter and mentors stay listed", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", [
      "Roster",
      "Slips",
      "RollCall",
      "QuickCards",
      "Pickup",
      "Messages",
      "Incidents",
      "Reports",
      "Learning",
    ]);
    const people = new PeoplePage(page);
    await people.open();

    await expect.poll(() => people.names()).toContain("Daniel Osei");
    await expect(
      people.columnHeaders.filter({ hasText: /^Mentor$/ }),
    ).toHaveCount(0);
    await expect(
      people.roleFilter.locator("option", { hasText: /^Mentor$/ }),
    ).toHaveCount(0);
  });

  test("Given only Tom, when he opens People, then it says it is just him with Invite staff", async ({
    page,
    api,
  }) => {
    api.leaveOnly("m-tom");
    const people = new PeoplePage(page);
    await people.open();

    await expect(people.emptyState).toContainText("It’s just you so far");
    await expect(people.inviteButton).toBeVisible();
    await people.expectAccessible();
  });

  test("Given the directory fails to load, when Tom tries again, then it loads", async ({
    page,
    api,
  }) => {
    api.failNext("/api/people", 500);
    const people = new PeoplePage(page);
    await people.open();
    await expect(people.emptyState).toContainText("We couldn’t load people");
    await people.expectAccessible();

    api.recover("/api/people");
    await people.tryAgain();
    await expect.poll(() => people.names()).toHaveLength(10);
  });
});

test.describe("The people directory for anyone else", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given a program director, when she opens People, then only admins manage people and her menu has no People", async ({
    page,
  }) => {
    const shell = new ShellPage(page);
    const people = new PeoplePage(page);
    await people.open();

    await expect(people.heading).toHaveText("Only admins manage people");
    await people.expectAccessible();
    await shell.openMenu();
    expect(await shell.menuLabels()).not.toContain("People");
  });
});
