import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** The cohort report (mock: report-cohort) and its export dialog (mock: export-report). */
export class CohortReportPage extends BasePage {
  async openFor(programId: string, name: string): Promise<void> {
    await super.open(`/reports/cohorts/${programId}`);
    await this.expectCohort(name);
  }

  async expectCohort(name: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name }),
    ).toBeVisible();
  }

  stat(label: string): Locator {
    return this.page.getByTestId(`stat-${label}`).getByTestId("stat-value");
  }

  statCard(label: string): Locator {
    return this.page.getByTestId(`stat-${label}`);
  }

  get youth(): Locator {
    return this.page.getByRole("table", { name: /^Youth in / });
  }

  youthRow(name: string): Locator {
    return this.youth
      .getByRole("row")
      .filter({ has: this.page.getByRole("link", { name, exact: true }) });
  }

  column(label: string): Locator {
    return this.youth.getByRole("columnheader", { name: label, exact: true });
  }

  moduleCompletion(title: string): Locator {
    return this.page.getByRole("progressbar", {
      name: new RegExp(`^${title}`),
    });
  }

  get modulesCard(): Locator {
    return this.page.getByRole("heading", { name: "Completion by module" });
  }

  get comparison(): Locator {
    return this.page.getByRole("region", {
      name: "Compared with the organization",
    });
  }

  async chooseCohort(name: string): Promise<void> {
    await this.page
      .getByLabel("Cohort", { exact: true })
      .selectOption({ label: name });
  }

  async openYouth(name: string): Promise<void> {
    await this.youth.getByRole("link", { name, exact: true }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  async exportCsv(): Promise<void> {
    await this.page.getByRole("button", { name: "Export CSV" }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole("button", { name: "Export CSV" }).click();
  }

  get download(): Locator {
    return this.dialog.getByRole("link", { name: /^Download/ });
  }

  get empty(): Locator {
    return this.page.getByRole("heading", {
      name: "No youth in this cohort yet",
    });
  }

  get loadError(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t build the cohort report",
    });
  }

  async retry(): Promise<void> {
    await this.page.getByRole("button", { name: "Try again" }).click();
  }

  get forbidden(): Locator {
    return this.page.getByRole("heading", {
      name: "Reports are for directors and site leads",
    });
  }

  get notFound(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t find that cohort",
    });
  }
}
