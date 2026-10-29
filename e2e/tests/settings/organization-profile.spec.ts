import { test, expect } from "../../fixtures/test";
import { SettingsOrganizationPage } from "../../pages/settings-organization.page";

// Acceptance Test
// Traces to: L2-122 criteria 1 to 7, L2-001, L2-007, L2-032, L2-035, L2-036
// Description: Admins and program directors keep the organization's profile on Settings › Organization, edited in a dialog.
test.describe("Configure the organization profile", () => {
  test.use({ signedInAs: "m-tom" });

  test("Given Tom opens Settings, then he lands on Organization with the profile", async ({
    page,
  }) => {
    const settings = new SettingsOrganizationPage(page);

    await settings.open("/settings");

    await expect(page).toHaveURL(/\/settings\/organization$/);
    await expect(settings.currentTab).toHaveText("Organization");
    await expect(settings.fact("name")).toContainText(
      "Harbourview Youth Collective",
    );
    await expect(settings.fact("city")).toContainText("Hamilton, Ontario");
    await expect(settings.fact("contact-email")).toContainText("Not given");
    await expect(settings.fact("phone")).toContainText("905-555-0100");
    await expect(settings.fact("time-zone")).toContainText("Eastern (Toronto)");
    await settings.expectAccessible();
    await settings.expectNoHorizontalScroll();
  });

  test("Given the profile dialog, when Tom saves a new contact, phone and time zone, then the card shows them with a toast", async ({
    page,
    api,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();

    await settings.editProfile();
    await settings.expectAccessible();
    await settings.fillProfile({
      name: "Harbourview Youth",
      contactEmail: "hello@harbourview.example",
      phone: "905-555-0111",
      timeZone: "Atlantic (Halifax)",
    });
    await settings.saveProfile();

    await expect(settings.toast).toContainText("Organization profile saved");
    await expect(settings.profileDialog).toHaveCount(0);
    await expect(settings.fact("name")).toContainText("Harbourview Youth");
    await expect(settings.fact("contact-email")).toContainText(
      "hello@harbourview.example",
    );
    await expect(settings.fact("phone")).toContainText("905-555-0111");
    await expect(settings.fact("time-zone")).toContainText(
      "Atlantic (Halifax)",
    );
    expect(api.auditOf("Organization").at(-1)?.summary).toContain(
      "name, contact email, phone, time zone",
    );
  });

  test("Given an empty name, an email without a domain and a phone without its area code, then the dialog says why and nothing changes", async ({
    page,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();

    await settings.editProfile();
    await settings.fillProfile({
      name: "",
      contactEmail: "hello@harbourview",
      phone: "555-0100",
    });
    await settings.saveProfile();

    const dialog = settings.profileDialog;
    await expect(settings.summaryIn(dialog)).toBeVisible();
    await expect(settings.dialogError(dialog, "org-name")).toHaveText(
      "Enter your organization’s name.",
    );
    await expect(settings.dialogError(dialog, "org-email")).toHaveText(
      "Enter an email like hello@example.org.",
    );
    await expect(settings.dialogError(dialog, "org-phone")).toHaveText(
      "Include the area code, like 905-555-0100.",
    );
    await settings.expectAccessible();
  });

  test("Given the save fails, then the dialog keeps what was typed and says nothing changed", async ({
    page,
    api,
  }) => {
    const settings = new SettingsOrganizationPage(page);
    await settings.open();
    await settings.editProfile();
    api.failNext("/api/settings/organization/profile", 500);

    await settings.fillProfile({ phone: "905-555-0199" });
    await settings.saveProfile();

    await expect(settings.failedIn(settings.profileDialog)).toBeVisible();
    await expect(settings.profileDialog.getByLabel(/^Phone/)).toHaveValue(
      "905-555-0199",
    );
  });

  test("Given the profile fails to load, then the page offers Try again", async ({
    page,
    api,
  }) => {
    api.failNext("/api/settings/organization/profile", 500);
    const settings = new SettingsOrganizationPage(page);

    await settings.open();

    await expect(settings.loadError).toBeVisible();
    await settings.expectAccessible();
  });

  test.describe("as a site lead", () => {
    test.use({ signedInAs: "m-jaylen" });

    test("Given Jaylen opens Settings › Organization, then he is told admins set it up and the API answers 403", async ({
      page,
    }) => {
      const settings = new SettingsOrganizationPage(page);

      await settings.open();

      await expect(settings.forbidden).toBeVisible();
      expect(await settings.apiStatus("/settings/organization/profile")).toBe(
        403,
      );
      await settings.expectAccessible();
    });
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 360, height: 800 } });

    test("Given a 360px screen, then the profile and its dialog fit without sideways scrolling", async ({
      page,
    }) => {
      const settings = new SettingsOrganizationPage(page);
      await settings.open();

      await settings.expectNoHorizontalScroll();
      await settings.editProfile();
      await settings.expectNoHorizontalScroll();
      await settings.expectAccessible();
    });
  });
});
