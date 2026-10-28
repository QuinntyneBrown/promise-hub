import { test, expect } from "../../fixtures/test";
import { GuardianHomePage } from "../../pages/guardian-home.page";

// Acceptance Test
// Traces to: L2-102, L2-104, L2-026, L2-027, L2-005, L2-001, L2-035, L2-036
// Description: A guardian uses the guardian portal from the household link: each child's page, read only.
test.describe("Use the guardian portal", () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage("hh-rivera", "English");
    api.trustGuardianDevice("hh-rivera");
  });

  test("Given Carmen’s verified household link, when she opens it, then each child is listed with their programs and links to their page", async ({
    page,
  }) => {
    const home = new GuardianHomePage(page);

    await home.open("tok-home-rivera");

    await expect(home.child("Mateo Rivera")).toContainText(
      "After-School Tutoring",
    );
    await expect(home.child("Sofía Rivera")).toContainText(
      "After-School Tutoring",
    );
    await home.expectAccessible();
    await expect(home.childLink("Sofía Rivera")).toHaveAttribute(
      "href",
      "/g/home/tok-home-rivera/children/c-sofia",
    );
  });
});
