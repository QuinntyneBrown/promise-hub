import { test, expect } from "../../fixtures/test";
import { learningReports, northgateReports } from "../../fixtures/report-data";
import { CohortReportPage } from "../../pages/report-cohort.page";
import { ReportsPage } from "../../pages/reports.page";

// Acceptance test. Traces to: L2-127 criteria 1, 2, 4 to 7 (the cohort report from Detailed reports; learning while Learning is on, at risk
// and check-ins while Mentoring is on; roles, tenants, Reports off; empty, error), L2-035, L2-036.
test.describe("Report on a cohort as a program director", () => {
  test.use({ signedInAs: "m-marisol" });

  test("Given Harbourview with Learning and Mentoring on, when Marisol opens the cohort report from Detailed reports, then enrolment, attendance, learning and each youth show", async ({
    page,
    api,
  }) => {
    learningReports(api);
    const reports = new ReportsPage(page);
    const cohort = new CohortReportPage(page);
    await reports.open();
    await expect(reports.detailed.getByRole("link")).toHaveText([
      /^Cohort report/,
      /^Progress board/,
      /^Staff activity/,
    ]);

    await reports.openDetailed("Cohort report");

    await cohort.expectCohort("After-School Tutoring");
    await expect(cohort.stat("Youth enrolled")).toHaveText("5");
    await expect(cohort.stat("Average completion")).toHaveText("50%");
    await expect(cohort.stat("Attendance")).toHaveText("50%");
    await expect(cohort.stat("Retention")).toHaveText("100%");
    await expect(cohort.stat("At risk")).toHaveText("1");
    await expect(cohort.moduleCompletion("Knowing Yourself")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    await expect(cohort.youthRow("Nadia Haddad")).toContainText("100%");
    await expect(cohort.youthRow("Nadia Haddad")).toContainText("At risk");
    await expect(cohort.youthRow("Mateo Rivera")).toContainText("No account");
    await expect(cohort.comparison).toContainText("50%");
    await cohort.expectAccessible();
    await cohort.expectNoHorizontalScroll();
  });

  test("Given another cohort is chosen, then its report shows", async ({
    page,
    api,
  }) => {
    learningReports(api);
    const cohort = new CohortReportPage(page);
    await cohort.openFor("p-tutoring", "After-School Tutoring");

    await cohort.chooseCohort("Saturday Sports");

    await cohort.expectCohort("Saturday Sports");
    await expect(cohort.stat("Youth enrolled")).toHaveText("2");
    await expect(page).toHaveURL(/\/reports\/cohorts\/p-sports$/);
  });

  test("Given a phone, then the report fits and the youth table scrolls inside its own frame", async ({
    page,
    api,
  }) => {
    learningReports(api);
    await page.setViewportSize({ width: 360, height: 800 });
    const cohort = new CohortReportPage(page);

    await cohort.openFor("p-tutoring", "After-School Tutoring");

    await expect(cohort.youth).toBeVisible();
    await cohort.expectNoHorizontalScroll();
    await cohort.expectAccessible();
  });

  test("Given a cohort with no one enrolled, then it says so", async ({
    page,
    api,
  }) => {
    learningReports(api);
    const cohort = new CohortReportPage(page);

    await cohort.openFor("p-winter", "Winter Camp 2026");

    await expect(cohort.empty).toBeVisible();
    await cohort.expectAccessible();
  });

  test("Given the report fails, then it offers Try again", async ({
    page,
    api,
  }) => {
    learningReports(api);
    api.failNext("/api/reports/cohorts/p-tutoring", 500);
    const cohort = new CohortReportPage(page);
    await page.goto("/reports/cohorts/p-tutoring");
    await expect(cohort.loadError).toBeVisible();
    api.recover("/api/reports/cohorts/p-tutoring");

    await cohort.retry();

    await cohort.expectCohort("After-School Tutoring");
  });

  test("Given another organization’s cohort, then it is not found", async ({
    page,
    api,
  }) => {
    learningReports(api);
    const cohort = new CohortReportPage(page);

    await page.goto("/reports/cohorts/p-kids-club");

    await expect(cohort.notFound).toBeVisible();
    expect(await cohort.apiStatus("/reports/cohorts/p-kids-club")).toBe(404);
  });

  test("Given Reports is off, then the cohort report redirects to Today and the API answers 404", async ({
    page,
    api,
  }) => {
    api.setModules("org-harbourview", [
      "Roster",
      "RollCall",
      "Learning",
      "Mentoring",
    ]);
    await page.goto("/reports/cohorts/p-tutoring");

    await expect(page).toHaveURL(/\/$/);
    expect(
      await new CohortReportPage(page).apiStatus("/reports/cohorts/p-tutoring"),
    ).toBe(404);
  });
});

test.describe("Report on a cohort where Learning and Mentoring are off", () => {
  test.use({ signedInAs: "m-grace" });

  test("Given Northgate, then Detailed reports lists the cohort report only and it shows no learning or mentoring", async ({
    page,
    api,
  }) => {
    northgateReports(api);
    const reports = new ReportsPage(page);
    const cohort = new CohortReportPage(page);
    const requested = cohort.recordApiPaths();
    await reports.open();
    await expect(reports.detailed.getByRole("link")).toHaveText([
      /^Cohort report/,
    ]);

    await reports.openDetailed("Cohort report");

    await cohort.expectCohort("Kids Club");
    await expect(cohort.stat("Youth enrolled")).toHaveText("1");
    await expect(cohort.statCard("Average completion")).toHaveCount(0);
    await expect(cohort.statCard("At risk")).toHaveCount(0);
    await expect(cohort.modulesCard).toHaveCount(0);
    await expect(cohort.column("Learning")).toHaveCount(0);
    await expect(cohort.column("Check-ins")).toHaveCount(0);
    expect(
      requested.filter(
        (p) => p.startsWith("/api/learning") || p.startsWith("/api/mentoring"),
      ),
    ).toEqual([]);
    await cohort.expectAccessible();
  });
});

test.describe("Report on a cohort as a youth worker", () => {
  test.use({ signedInAs: "m-aisha" });

  test("Given Aisha, then the cohort report says who reads reports", async ({
    page,
  }) => {
    const cohort = new CohortReportPage(page);

    await page.goto("/reports/cohorts/p-tutoring");

    await expect(cohort.forbidden).toBeVisible();
    await cohort.expectAccessible();
  });
});
