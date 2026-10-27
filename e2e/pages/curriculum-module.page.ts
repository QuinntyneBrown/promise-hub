import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** The module editor (mock: curriculum-module): details, lessons in order and visibility. */
export class CurriculumModulePage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/curriculum/modules/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(
      this.page.getByRole("heading", {
        level: 1,
        name: new RegExp(`^${title}`),
      }),
    ).toBeVisible();
    await expect(this.name).toHaveValue(title);
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId("page-subtitle");
  }

  get name(): Locator {
    return this.page.getByLabel("Module name");
  }

  get description(): Locator {
    return this.page.getByLabel(/^Description/);
  }

  get prerequisite(): Locator {
    return this.page.getByLabel("Prerequisite");
  }

  get anchor(): Locator {
    return this.page.getByLabel(/^Anchor passage/);
  }

  get errorSummary(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "Fix these to continue" });
  }

  get failedAlert(): Locator {
    return this.page
      .getByRole("alert")
      .filter({ hasText: "We couldn’t save the module" });
  }

  get notFound(): Locator {
    return this.page.getByRole("heading", {
      name: "We can’t find that module",
    });
  }

  fieldError(id: string): Locator {
    return this.page.getByTestId(`${id}-error`);
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }

  async save(): Promise<void> {
    await this.page.getByRole("button", { name: "Save module" }).click();
  }

  async backToCurriculum(): Promise<void> {
    await this.page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: "Curriculum" })
      .click();
  }
}
