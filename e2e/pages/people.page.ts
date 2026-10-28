import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** People (mock: people): every account of the organization with search, filters and pages. */
export class PeoplePage extends BasePage {
  async open(): Promise<void> {
    await super.open("/people");
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get table(): Locator {
    return this.page.getByRole("table", { name: "People" });
  }

  get columnHeaders(): Locator {
    return this.table.getByRole("columnheader");
  }

  /** The people listed, in order. */
  async names(): Promise<string[]> {
    return this.table.getByRole("link").allInnerTexts();
  }

  row(name: string): Locator {
    return this.table
      .getByRole("row")
      .filter({ has: this.page.getByRole("link", { name, exact: true }) });
  }

  async openPerson(name: string): Promise<void> {
    await this.table.getByRole("link", { name, exact: true }).click();
  }

  async search(text: string): Promise<void> {
    await this.page.getByLabel("Search people").fill(text);
  }

  get roleFilter(): Locator {
    return this.page.getByLabel("Role", { exact: true });
  }

  async filterRole(label: string): Promise<void> {
    await this.roleFilter.selectOption({ label });
  }

  async filterStatus(label: string): Promise<void> {
    await this.page
      .getByLabel("Status", { exact: true })
      .selectOption({ label });
  }

  async filterProgram(label: string): Promise<void> {
    await this.page
      .getByLabel("Program", { exact: true })
      .selectOption({ label });
  }

  get pagination(): Locator {
    return this.page.getByRole("navigation", { name: "Pagination" });
  }

  async nextPage(): Promise<void> {
    await this.pagination.getByRole("button", { name: "Next" }).click();
  }

  get emptyState(): Locator {
    return this.page.getByRole("main");
  }

  async clearSearch(): Promise<void> {
    await this.page.getByRole("button", { name: "Clear search" }).click();
  }

  async tryAgain(): Promise<void> {
    await this.page.getByRole("button", { name: "Try again" }).click();
  }

  get inviteButton(): Locator {
    return this.page.getByRole("button", { name: "Invite staff" }).first();
  }
}
