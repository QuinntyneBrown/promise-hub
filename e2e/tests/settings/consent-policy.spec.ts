import { test, expect } from "../../fixtures/test";
import { SettingsPrivacyPage } from "../../pages/settings-privacy.page";

// Acceptance Test
// Traces to: L2-056 criteria 1 and 8, L2-030, L2-007, L2-005
// Description: Admins and program directors set the consent age and the wording guardians sign.
test.describe("Configure the consent policy", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given Harbourview has no policy yet, when Privacy opens, then consent is needed under 18 with the default wording", async ({
    page,
  }) => {
    const privacy = new SettingsPrivacyPage(page);

    await privacy.open();

    await expect(privacy.consentAge).toContainText("18 years");
    await expect(privacy.consentWording).toContainText(
      "I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective",
    );
    await privacy.expectAccessible();
    await privacy.expectNoHorizontalScroll();
  });

  test("Given the consent policy dialog, when Marisol chooses 16 and new wording, then it saves and the card shows it", async ({
    page,
  }) => {
    const privacy = new SettingsPrivacyPage(page);
    await privacy.open();

    await privacy.editConsentPolicy();
    await privacy.expectAccessible();
    await privacy.saveConsentPolicy(
      "16 years",
      "We agree that our child may join lessons and mentoring at Harbourview.",
    );

    await expect(privacy.toast).toContainText("Consent policy saved");
    await expect(privacy.consentAge).toContainText("16 years");
    await expect(privacy.consentWording).toContainText(
      "We agree that our child may join lessons and mentoring at Harbourview.",
    );
  });

  test("Given wording that is too short, when saved, then the dialog says why and stays open", async ({
    page,
  }) => {
    const privacy = new SettingsPrivacyPage(page);
    await privacy.open();

    await privacy.editConsentPolicy();
    await privacy.saveConsentPolicy("18 years", "Yes.");

    await expect(privacy.consentPolicyDialog).toContainText(
      "Write the wording guardians sign, 20 to 2,000 characters.",
    );
    await expect(privacy.consentAge).toContainText("18 years");
  });

  test("Given Roster is off, when Privacy opens, then the consent card is not rendered and the API answers 404", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", []);
    const privacy = new SettingsPrivacyPage(page);

    await privacy.open();

    await expect(privacy.region).toContainText("Canada");
    await expect(privacy.consentCard).toHaveCount(0);
    expect(await privacy.consentApiStatus()).toBe(404);
  });
});
