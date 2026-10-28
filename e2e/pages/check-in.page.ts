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

  /** The caption under a total: how many of the checked in were late, how many of the absent were excused. */
  caption(label: 'Checked in' | 'Absent'): Locator {
    return this.page.getByRole('group', { name: 'Session totals' }).getByTestId(`total-${label}`).getByTestId('stat-caption');
  }

  /** Chooses Late or Excused in the open check-in sheet and saves it. */
  async mark(choice: 'Late' | 'Excused'): Promise<void> {
    await this.dialog.getByRole('radio', { name: new RegExp(`^${choice}`) }).check();
    await this.dialog.getByRole('button', { name: choice === 'Late' ? 'Check in late' : 'Mark excused' }).click();
    await expect(this.dialog).toBeHidden();
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
    await this.page
      .getByRole('navigation', { name: 'Primary', exact: true })
      .or(this.page.getByRole('navigation', { name: 'Primary, phone' }))
      .getByRole('link', { name: 'Check-in' })
      .first()
      .click();
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
    await this.row(name)
      .getByRole('button', { name: `Check in ${name}` })
      .click();
  }

  async openOptions(name: string): Promise<void> {
    await this.row(name)
      .getByRole('button', { name: `More for ${name}` })
      .click();
    await expect(this.dialog).toBeVisible();
  }

  async markAbsent(name: string): Promise<void> {
    await this.openOptions(name);
    await this.dialog.getByRole('radio', { name: /^Mark absent instead/ }).check();
    await this.dialog.getByRole('button', { name: 'Mark absent' }).click();
    await expect(this.dialog).toBeHidden();
  }

  /** Milliseconds, measured in the page, from the tap on Check in until the row says the child is checked in (L2-033). */
  async timeCheckIn(name: string): Promise<number> {
    await expect(this.checkInButton(name)).toBeVisible();
    const elapsed = await this.page.evaluate(
      (label) =>
        new Promise<number>((resolve) => {
          // The row re-renders when it changes, so find it afresh on every frame.
          const button = document.querySelector<HTMLButtonElement>(`button[aria-label="Check in ${label}"]`)!;
          const start = performance.now();
          const done = () => {
            const row = document.querySelector(`[aria-label="Quick Card for ${label}"]`)?.closest('li, [role="listitem"]');
            return row?.textContent?.includes('Checked in') ? resolve(performance.now() - start) : requestAnimationFrame(done);
          };
          button.click();
          requestAnimationFrame(done);
        }),
      name,
    );
    await expect(this.row(name)).toContainText('Checked in');
    return elapsed;
  }

  /** Types the text one key at a time and returns, per keystroke, the ms until the roster has settled on its rows (L2-033). */
  async timeSearch(text: string): Promise<number[]> {
    const box = this.page.getByRole('searchbox', { name: 'Find a child' });
    const times: number[] = [];
    for (let i = 1; i <= text.length; i++) {
      const value = text.slice(0, i);
      times.push(
        await box.evaluate(
          (input, typed) =>
            new Promise<number>((resolve) => {
              const field = input as HTMLInputElement;
              const names = () => [...document.querySelectorAll('[data-testid="roster-name"]')].map((n) => n.textContent ?? '');
              const start = performance.now();
              field.value = typed;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              const words = typed.toLowerCase();
              const check = () => (names().every((n) => n.toLowerCase().includes(words)) ? resolve(performance.now() - start) : requestAnimationFrame(check));
              requestAnimationFrame(check);
            }),
          value,
        ),
      );
    }
    return times;
  }

  async search(text: string): Promise<void> {
    await this.page.getByRole('searchbox', { name: 'Find a child' }).fill(text);
  }

  async filter(name: string): Promise<void> {
    await this.page
      .getByRole('group', { name: 'Filter roster' })
      .getByRole('button', { name: new RegExp(`^${name}`) })
      .click();
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
    const labels = await this.dialog
      .getByRole('group', { name: 'Picked up by' })
      .getByRole('radio')
      .evaluateAll((inputs) => inputs.map((i) => (i.closest('label')?.querySelector('.text')?.firstChild?.textContent ?? '').trim()));
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

  /** Asks the primary guardian by text about the adult named, instead of calling. */
  async askGuardian(name: string): Promise<void> {
    await this.pickUpBy('Someone else');
    await this.dialog.getByLabel('Their name').fill(name);
    await this.dialog.getByRole('button', { name: /^Ask .+ by text$/ }).click();
  }

  get guardianAnswer(): Locator {
    return this.dialog.getByTestId('guardian-answer');
  }

  get signOutConfirm(): Locator {
    return this.dialog.getByRole('button', { name: 'Sign out' });
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
