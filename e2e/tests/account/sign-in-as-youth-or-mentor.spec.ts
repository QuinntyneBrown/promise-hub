import { test, expect } from "../../fixtures/test";
import { seededPassword } from "../../fixtures/seed";
import { LearningPage } from "../../pages/learning.page";
import { MentoringPage } from "../../pages/mentoring.page";
import { SignInPage } from "../../pages/sign-in.page";
import { TodayPage } from "../../pages/today.page";

// Acceptance Test
// Traces to: L2-046, L2-005, L2-035
// Description: youth and mentors sign in with the staff form and land on the home of their role, or Today when its module is off.
test.describe("Sign in as a youth or mentor", () => {
  test.use({ signedInAs: null });

  test("Given Sofía is a youth at Harbourview with Learning on, when she signs in, then she lands on Learning", async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    await signIn.open("/sign-in");
    await signIn.expectAccessible();

    await signIn.signIn("sofia@harbourview.example", seededPassword);

    const learning = new LearningPage(page);
    await learning.expectOpen();
    await expect(page).toHaveURL(/\/learning$/);
    await learning.expectAccessible();
    await learning.expectNoHorizontalScroll();
  });

  test("Given Daniel is a mentor at Harbourview with Mentoring on, when he signs in, then he lands on Mentoring", async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    await signIn.open("/sign-in");

    await signIn.signIn("daniel@harbourview.example", seededPassword);

    const mentoring = new MentoringPage(page);
    await mentoring.expectOpen();
    await expect(page).toHaveURL(/\/mentoring$/);
    await mentoring.expectAccessible();
  });

  test("Given Lucía is a youth at Northgate where Learning is off, when she signs in, then she lands on Today and nothing from Learning loads", async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    const requested = signIn.recordApiPaths();
    await signIn.open("/sign-in");

    await signIn.signIn("lucia@northgate.example", seededPassword);

    const today = new TodayPage(page);
    await expect(today.heading).toHaveText("Welcome, Lucía");
    await expect(page).toHaveURL(/\/$/);
    await expect(today.nothingToDo).toBeVisible();
    expect(requested.filter((p) => p.startsWith("/api/learning"))).toEqual([]);
    expect(await new LearningPage(page).apiStatus()).toBe(404);
  });

  test("Given Samuel is a mentor at Northgate where Mentoring is off, when he signs in, then he lands on Today and the mentoring API answers 404", async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    await signIn.open("/sign-in");

    await signIn.signIn("samuel@northgate.example", seededPassword);

    await expect(new TodayPage(page).heading).toHaveText("Welcome, Samuel");
    await expect(page).toHaveURL(/\/$/);
    expect(await new MentoringPage(page).apiStatus()).toBe(404);
  });

  test("Given a youth opened a deep link while signed out, when she signs in, then she reaches that page instead of Learning", async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    await signIn.open("/notifications");
    await signIn.expectShown();

    await signIn.signIn("sofia@harbourview.example", seededPassword);

    await expect(page).toHaveURL(/\/notifications$/);
  });

  test("Given a youth with a wrong password, when she signs in, then the one generic message shows", async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    await signIn.open("/sign-in");

    await signIn.signIn("sofia@harbourview.example", "not-my-password");

    await expect(signIn.passwordError).toHaveText(
      "That email and password don’t match. Try again or reset your password.",
    );
  });
});
