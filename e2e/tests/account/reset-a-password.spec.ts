import { test, expect } from "../../fixtures/test";
import { LearningPage } from "../../pages/learning.page";
import { MentoringPage } from "../../pages/mentoring.page";
import { ResetPasswordPage } from "../../pages/reset-password.page";
import { TodayPage } from "../../pages/today.page";

// Acceptance Test
// Traces to: L2-115, L2-116, L2-053, L2-046, L2-005, L2-035, L2-036
// Description: a youth or a mentor resets a forgotten password: the same answer for every address, a masked address with resend,
// at most three emails an hour, only the newest link works, the shared policy, and the role home with a toast.
test.describe("Reset a password as a youth or mentor", () => {
  test.use({ signedInAs: null });

  test("Given Sofía forgot her password, when she asks with her email, then the page masks her address and offers to resend", async ({
    page,
    api,
  }) => {
    const reset = new ResetPasswordPage(page);
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(reset.emailField).toBeVisible();
    await reset.expectAccessible();

    await reset.askForLink("sofia@harbourview.example");

    await expect(reset.heading).toHaveText("Check your email");
    await expect(reset.subtitle).toContainText("s••••@harbourview.example");
    await expect(reset.subtitle).not.toContainText("sofia@");
    await expect(reset.backToSignIn).toBeVisible();
    expect(api.resetEmailsTo("sofia@harbourview.example")).toBe(1);
    await reset.expectAccessible();
    await reset.expectNoHorizontalScroll();

    await reset.resend();

    await expect(reset.toast("Sent again")).toBeVisible();
    expect(api.resetEmailsTo("sofia@harbourview.example")).toBe(2);
  });

  test("Given an address with no account, when a link is asked for, then the page is the same and no email is sent", async ({
    page,
    api,
  }) => {
    const reset = new ResetPasswordPage(page);
    await page.goto("/forgot-password");

    await reset.askForLink("nobody@example.org");

    await expect(reset.heading).toHaveText("Check your email");
    await expect(reset.subtitle).toContainText("n••••@example.org");
    expect(api.resetEmailsTo("nobody@example.org")).toBe(0);
  });

  test("Given three links this hour, when Sofía resends again, then the page answers the same and no fourth email goes out", async ({
    page,
    api,
  }) => {
    const reset = new ResetPasswordPage(page);
    await page.goto("/forgot-password");
    await reset.askForLink("sofia@harbourview.example");
    await reset.resend();
    await reset.resend();
    expect(api.resetEmailsTo("sofia@harbourview.example")).toBe(3);

    await reset.resend();

    await expect(reset.toast("Sent again").last()).toBeVisible();
    await expect(reset.heading).toHaveText("Check your email");
    expect(api.resetEmailsTo("sofia@harbourview.example")).toBe(3);
  });

  test("Given an address that is not an email, when asked, then it says to enter an email address", async ({
    page,
  }) => {
    const reset = new ResetPasswordPage(page);
    await page.goto("/forgot-password");

    await reset.askForLink("sofia");

    await expect(reset.fieldError("email")).toHaveText(
      "Enter your email address.",
    );
    await reset.expectAccessible();
  });

  test("Given Sofía asked for a new link, when she opens the earlier one, then it has expired", async ({
    page,
  }) => {
    const reset = new ResetPasswordPage(page);
    await page.goto("/forgot-password");
    await reset.askForLink("sofia@harbourview.example");
    await expect(reset.heading).toHaveText("Check your email");

    await reset.openLink("tok-reset-sofia");

    await expect(reset.heading).toHaveText("This link has expired");
    await expect(
      page.getByRole("link", { name: "Send a new link" }),
    ).toBeVisible();
    await reset.expectAccessible();
  });

  test("Given Sofía's link, when her password contains her email name and then a good one, then she lands on Learning with Password updated", async ({
    page,
  }) => {
    const reset = new ResetPasswordPage(page);
    await reset.openLink("tok-reset-sofia");
    await expect(reset.subtitle).toHaveText("For sofia@harbourview.example");
    await expect(reset.passwordHelp).toContainText("not your email");
    await expect(reset.passwordInput("New password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    await expect(reset.passwordInput("Repeat it")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    await expect(reset.showPasswordToggles).toHaveCount(2);
    await reset.expectAccessible();

    await reset.choose("sofia-loves-coding");
    await expect(reset.fieldError("password")).toHaveText(
      "Don’t use your email in your password.",
    );
    await reset.choose("harbour-lantern-2027");

    const learning = new LearningPage(page);
    await learning.expectOpen();
    await expect(page).toHaveURL(/\/learning$/);
    await expect(reset.toast("Password updated")).toContainText(
      "Other devices were signed out.",
    );
    await learning.expectAccessible();
  });

  test("Given Daniel's link, when he sets a new password, then he lands on Mentoring", async ({
    page,
  }) => {
    const reset = new ResetPasswordPage(page);
    await reset.openLink("tok-reset-daniel");

    await reset.choose("harbour-lantern-2027");

    const mentoring = new MentoringPage(page);
    await mentoring.expectOpen();
    await expect(page).toHaveURL(/\/mentoring$/);
    await expect(reset.toast("Password updated")).toBeVisible();
  });

  test("Given Lucía at Northgate where Learning is off, when she resets, then she lands on Today and nothing from Learning loads", async ({
    page,
  }) => {
    const reset = new ResetPasswordPage(page);
    const requested = reset.recordApiPaths();
    await reset.openLink("tok-reset-lucia");

    await reset.choose("harbour-lantern-2027");

    const today = new TodayPage(page);
    await expect(today.heading).toHaveText("Welcome, Lucía");
    await expect(page).toHaveURL(/\/$/);
    expect(
      requested.filter(
        (p) => p.startsWith("/api/learning") || p.startsWith("/api/mentoring"),
      ),
    ).toEqual([]);
    expect(await new LearningPage(page).apiStatus()).toBe(404);
  });

  test("Given the save fails, when Sofía sets her password, then the form stays with That didn't save", async ({
    page,
    api,
  }) => {
    const reset = new ResetPasswordPage(page);
    await reset.openLink("tok-reset-sofia");
    api.failNext("/api/auth/reset-password", 500);

    await reset.choose("harbour-lantern-2027");

    await expect(page.getByRole("alert")).toContainText("That didn’t save");
    await expect(reset.heading).toHaveText("Choose a new password");
    await reset.expectAccessible();
  });
});
