import { test, expect } from "../../fixtures/test";
import { AcceptInvitePage } from "../../pages/accept-invite.page";
import { ResetPasswordPage } from "../../pages/reset-password.page";

// Acceptance Test
// Traces to: L2-053
// Description: one password rule when accepting an invitation and when resetting, stated in the help text.
test.describe("Set a secure password", () => {
  test.use({ signedInAs: null });

  test("Given an invitation, when the password contains the email’s name, then the same rule as reset refuses it", async ({
    page,
    api,
  }) => {
    api.sentInvitation("inv-sam", "sam.ortiz@harbourview.example");
    const invite = new AcceptInvitePage(page);
    await invite.open("inv-sam");
    await expect(invite.passwordHelp).toHaveText(
      "At least 12 characters, and not your email. A short sentence works well.",
    );

    await invite.accept("Sam Ortiz", "call me sam.ortiz please");

    await expect(invite.fieldError("password")).toHaveText(
      "Don’t use your email in your password.",
    );
    await invite.expectAccessible();
  });

  test("Given a reset link, when the password contains the email’s name, then it is refused the same way", async ({
    page,
  }) => {
    const reset = new ResetPasswordPage(page);
    await reset.openLink("tok-reset-jaylen");
    await expect(reset.passwordHelp).toContainText(
      "At least 12 characters, and not your email.",
    );

    await reset.choose("jaylen runs tutoring 2027");

    await expect(reset.fieldError("password")).toHaveText(
      "Don’t use your email in your password.",
    );
  });
});
