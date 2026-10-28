import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Attendance history (mock: attendance-history) with the correct-attendance dialog. */
export class AttendanceHistoryPage extends BasePage {
  async open(path = '/check-in/history'): Promise<void> {
    await super.open(path);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get cohort(): Locator {
    return this.page.getByLabel('Cohort');
  }

  async chooseCohort(name: string): Promise<void> {
    await this.cohort.selectOption({ label: name });
  }

  stat(label: 'Attendance rate' | 'Sessions recorded' | 'Below 70%'): Locator {
    return this.page.getByTestId(`stat-${label}`).getByTestId('stat-value');
  }

  async showBy(view: 'By session' | 'By youth'): Promise<void> {
    await this.page.getByRole('tab', { name: view }).click();
  }

  get sessions(): Locator {
    return this.page.getByRole('table', { name: 'Attendance by session, newest first' });
  }

  get youth(): Locator {
    return this.page.getByRole('table', { name: 'Attendance by youth' });
  }

  /** The cells of a row, by the text of its first cell (a date or a name). */
  async row(table: Locator, first: string): Promise<string[]> {
    const row = table.getByRole('row').filter({ has: this.page.getByRole('cell', { name: first }) }).first();
    await expect(row).toBeVisible();
    return (await row.getByRole('cell').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());
  }

  correctButtons(): Locator {
    return this.sessions.getByRole('button', { name: /^Correct attendance for / });
  }

  get unrecorded(): Locator {
    return this.page.getByRole('main').getByRole('status').filter({ hasText: 'has no attendance' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async openCorrect(day: string): Promise<void> {
    await this.sessions.getByRole('button', { name: new RegExp(`^Correct attendance for .+, ${day}$`) }).click();
    await expect(this.dialog).toBeVisible();
  }

  async correct(values: { youth?: string; mark?: 'Present' | 'Late' | 'Excused' | 'Absent'; reason?: string }): Promise<void> {
    if (values.youth) await this.dialog.getByLabel('Youth').selectOption({ label: values.youth });
    if (values.mark) await this.dialog.getByRole('radio', { name: new RegExp(`^${values.mark}`) }).check();
    if (values.reason !== undefined) await this.dialog.getByLabel('Why are you correcting it?').fill(values.reason);
    await this.dialog.getByRole('button', { name: 'Save correction' }).click();
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No attendance recorded yet' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load attendance' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Attendance history is for site leads, directors and mentors' });
  }
}
