import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./base.page";

/** Staff and roles (mock: staff) with the invite-staff, change-role and remove-staff dialogs. */
export class StaffPage extends BasePage {
  async open(): Promise<void> {
    await super.open("/settings/staff");
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get dialog(): Locator {
    return this.page.getByRole("dialog");
  }

  get members(): Locator {
    return this.page.getByRole("list", { name: "Staff" });
  }

  get invitations(): Locator {
    return this.page.getByRole("list", { name: "Invitations" });
  }

  member(name: string): Locator {
    return this.members.getByRole("listitem").filter({ hasText: name });
  }

  invitation(email: string): Locator {
    return this.invitations.getByRole("listitem").filter({ hasText: email });
  }

  async openInvite(): Promise<void> {
    await this.page.getByRole("button", { name: "Invite staff" }).click();
    await expect(this.dialog).toBeVisible();
  }

  /** The role's radio; "Volunteer" never matches "Volunteer coordinator". */
  roleOption(role: string): Locator {
    return this.dialog.getByRole("radio", {
      name: new RegExp(`^${role}(?! coordinator)`),
    });
  }

  async invite(email: string, role: string): Promise<void> {
    await this.openInvite();
    await this.dialog.getByLabel("Work email").fill(email);
    await this.roleOption(role).check();
    await this.dialog.getByRole("button", { name: "Send invitation" }).click();
  }

  async changeRole(name: string, role: string): Promise<void> {
    await this.member(name)
      .getByRole("button", { name: `Change role for ${name}` })
      .click();
    await this.dialog
      .getByRole("radio", { name: new RegExp(`^${role}`) })
      .check();
    await this.dialog.getByRole("button", { name: "Change role" }).click();
  }

  async remove(name: string): Promise<void> {
    await this.member(name)
      .getByRole("button", { name: `Remove ${name}` })
      .click();
    await this.dialog.getByRole("button", { name: "Remove access" }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId("toast");
  }

  async resend(email: string): Promise<void> {
    await this.invitations
      .getByRole("button", { name: `Resend invitation to ${email}` })
      .click();
  }

  async withdraw(email: string): Promise<void> {
    await this.invitations
      .getByRole("button", { name: `Withdraw invitation to ${email}` })
      .click();
  }

  actions(name: string): Locator {
    return this.member(name).getByRole("button");
  }
}
