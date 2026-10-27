import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Curriculum, where authors build tracks and order their modules (mock: curriculum-tracks), with its dialogs. */
export class CurriculumPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/curriculum");
  }

  async expectOpen(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Curriculum" }),
    ).toBeVisible();
  }

  /** Opens Curriculum and waits for the tracks. */
  async openLoaded(): Promise<void> {
    await this.open();
    await this.expectOpen();
    await expect(
      this.page.getByRole("region").first().or(this.emptyState),
    ).toBeVisible();
  }

  get emptyState(): Locator {
    return this.page.getByRole("heading", { name: "No tracks yet" });
  }

  get errorState(): Locator {
    return this.page.getByRole("heading", {
      name: "We couldn’t load the curriculum",
    });
  }

  get forbiddenState(): Locator {
    return this.page.getByRole("heading", {
      name: "Program directors write the curriculum",
    });
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }

  stat(label: "tracks" | "modules" | "lessons"): Locator {
    return this.page.getByTestId(`kpi-${label}`).getByTestId("stat-value");
  }

  track(name: string): Locator {
    return this.page.getByRole("region", { name: new RegExp(`^${name}`) });
  }

  trackStatus(name: string): Locator {
    return this.track(name).getByTestId("track-status");
  }

  trackDetails(name: string): Locator {
    return this.track(name).getByTestId("track-details");
  }

  modules(track: string): Locator {
    return this.track(track).getByRole("list", { name: "Modules, in order" });
  }

  async moduleTitles(track: string): Promise<string[]> {
    return (
      await this.modules(track).getByTestId("list-title").allInnerTexts()
    ).map((t) => t.trim());
  }

  moduleRow(track: string, title: string): Locator {
    return this.modules(track).getByRole("listitem").filter({ hasText: title });
  }

  moveUp(module: string): Locator {
    return this.page.getByRole("button", { name: `Move ${module} up` });
  }

  moveDown(module: string): Locator {
    return this.page.getByRole("button", { name: `Move ${module} down` });
  }

  async openModule(track: string, title: string): Promise<void> {
    await this.modules(track)
      .getByRole("link", { name: new RegExp(title) })
      .click();
  }

  async newTrack(values: {
    name: string;
    key?: string;
    description?: string;
    publish?: boolean;
  }): Promise<void> {
    await this.page.getByRole("button", { name: "New track" }).first().click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel("Track name").fill(values.name);
    await this.dialog.getByLabel(/Track key/).fill(values.key ?? "");
    if (values.description)
      await this.dialog
        .getByLabel(/Short description/)
        .fill(values.description);
    if (values.publish)
      await this.dialog.getByRole("switch", { name: "Publish now" }).check();
  }

  async submitDialog(name: string): Promise<void> {
    await this.dialog.getByRole("button", { name }).click();
  }

  dialogError(field: string): Locator {
    return this.dialog.getByTestId(`${field}-error`);
  }

  async newModule(track: string, title: string): Promise<void> {
    await this.page
      .getByRole("button", { name: `New module in ${track}` })
      .click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByLabel("Module name").fill(title);
  }

  async apiStatus(path = "/api/curriculum"): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }

  async changeTrackStatus(
    track: string,
    status: "Draft" | "Published",
  ): Promise<void> {
    await this.page
      .getByRole("button", {
        name: new RegExp(`^(Publish|Status of) ${track}$`),
      })
      .click();
    await expect(this.dialog).toBeVisible();
    await this.dialog
      .getByRole("radio", { name: new RegExp(`^${status}`) })
      .check();
    await this.dialog.getByRole("button", { name: "Save status" }).click();
  }

  trackCohorts(name: string): Locator {
    return this.track(name).getByTestId("track-cohorts");
  }

  async openCohorts(track: string): Promise<void> {
    await this.page
      .getByRole("button", { name: `Cohorts following ${track}` })
      .click();
    await expect(this.dialog).toBeVisible();
  }

  cohortChoice(program: string): Locator {
    return this.dialog.getByRole("checkbox", {
      name: new RegExp(`^${program}`),
    });
  }
}
