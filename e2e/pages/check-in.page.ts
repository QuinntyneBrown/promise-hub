import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Check-in (mock: check-in) with the check-in sheet and the add-walk-in dialog. */
export class CheckInPage extends BasePage {
  async open(path = '/check-in'): Promise<void> {
    await super.open(path);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get roster(): Locator {
    return this.page.getByRole('list', { name: /^Roster for / });
  }

  get forbiddenText(): Locator {
    return this.page.getByTestId('empty-state-text');
  }

  /** The buttons that switch to today's other sessions. */
  otherSession(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  total(label: 'Checked in' | 'Absent' | 'Not yet'): Locator {
    return this.page.getByRole('group', { name: 'Session totals' }).getByTestId(`total-${label}`).getByTestId('stat-value');
  }

  get offlineBanner(): Locator {
    return this.page.getByRole('main').getByRole('status').filter({ hasText: 'You’re offline' });
  }

  get syncChip(): Locator {
    return this.page.getByTestId('sync-chip');
  }

  get nothingSaved(): Locator {
    return this.page.getByRole('heading', { name: 'Nothing is saved on this phone' });
  }

  conflictNote(name: string): Locator {
    return this.row(name).getByTestId('conflict');
  }

  async openQuickCard(name: string): Promise<void> {
    await this.row(name).getByRole('link', { name }).click();
  }

  /** The browser reports the connection is back, as it does when signal returns. */
  async connectionReturns(): Promise<void> {
    await this.page.evaluate(() => window.dispatchEvent(new Event('online')));
  }

  async openFromNavigation(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Primary', exact: true }).or(this.page.getByRole('navigation', { name: 'Primary, phone' })).getByRole('link', { name: 'Check-in' }).first().click();
  }

  get recorded(): Locator {
    return this.page.getByRole('main').getByRole('status').filter({ hasText: 'Session recorded' });
  }

  get notes(): Locator {
    return this.page.getByTestId('session-notes');
  }

  checkInButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: `Check in ${name}` });
  }

  get endSessionButton(): Locator {
    return this.page.getByRole('button', { name: 'End session' });
  }

  async endSession(notCheckedIn: 'Mark absent' | 'Leave as not recorded', notSignedOut: RegExp | string): Promise<void> {
    await this.endSessionButton.click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('radio', { name: new RegExp(`^${notCheckedIn}`) }).check();
    await this.dialog.getByRole('radio', { name: notSignedOut }).check();
    await this.dialog.getByRole('button', { name: 'End session' }).click();
  }

  async saveNotes(text: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Session notes' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('textbox').fill(text);
    await this.dialog.getByRole('button', { name: 'Save notes' }).click();
  }

  noShowNote(name: string): Locator {
    return this.row(name).getByTestId('no-show');
  }

  row(name: string): Locator {
    return this.roster.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async names(): Promise<string[]> {
    return (await this.roster.getByTestId('roster-name').allInnerTexts()).map((t) => t.trim());
  }

  async checkIn(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: `Check in ${name}` }).click();
  }

  async openOptions(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: `More for ${name}` }).click();
    await expect(this.dialog).toBeVisible();
  }

  async markAbsent(name: string): Promise<void> {
    await this.openOptions(name);
    await this.dialog.getByRole('radio', { name: /^Mark absent instead/ }).check();
    await this.dialog.getByRole('button', { name: 'Mark absent' }).click();
    await expect(this.dialog).toBeHidden();
  }

  async search(text: string): Promise<void> {
    await this.page.getByRole('searchbox', { name: 'Find a child' }).fill(text);
  }

  async filter(name: string): Promise<void> {
    await this.page.getByRole('group', { name: 'Filter roster' }).getByRole('button', { name: new RegExp(`^${name}`) }).click();
  }

  async addWalkIn(values: { childName: string; guardian: string }): Promise<void> {
    await this.dialog.getByLabel('Child’s name').fill(values.childName);
    await this.dialog.getByLabel('Guardian’s name and phone').fill(values.guardian);
    await this.dialog.getByRole('button', { name: 'Check in for tonight' }).click();
  }

  signOutButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: `Sign out ${name}` });
  }

  async openSignOut(name: string): Promise<void> {
    await this.signOutButton(name).click();
    await expect(this.dialog).toBeVisible();
  }

  /** The approved adults as offered, in order, without "Someone else". */
  async approvedAdults(): Promise<string[]> {
    const labels = await this.dialog.getByRole('group', { name: 'Picked up by' }).getByRole('radio').evaluateAll((inputs) =>
      inputs.map((i) => (i.closest('label')?.querySelector('.text')?.firstChild?.textContent ?? '').trim()),
    );
    return labels.filter((l) => l !== 'Someone else');
  }

  async pickUpBy(name: string): Promise<void> {
    await this.dialog.getByRole('radio', { name: new RegExp(`^${name}`) }).check();
  }

  async confirmSignOut(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Sign out' }).click();
  }

  get callPrimary(): Locator {
    return this.dialog.getByRole('link', { name: /^Call / });
  }

  async someoneElse(name: string, confirmed: boolean): Promise<void> {
    await this.pickUpBy('Someone else');
    await this.dialog.getByLabel('Their name').fill(name);
    if (confirmed) await this.dialog.getByRole('switch', { name: /confirmed by phone/ }).check();
  }

  /** Day-of totals when the session's event needs a slip. */
  clearanceTotal(label: 'Cleared' | 'Missing slip' | 'Declined'): Locator {
    return this.page.getByRole('group', { name: 'Permission slips' }).getByTestId(`clearance-${label}`).getByTestId('stat-value');
  }

  get clearanceWarning(): Locator {
    return this.page.getByText('Children without a signed slip can’t go.');
  }

  signOnTablet(name: string): Locator {
    return this.row(name).getByRole('link', { name: `Sign on tablet for ${name}` });
  }
}
