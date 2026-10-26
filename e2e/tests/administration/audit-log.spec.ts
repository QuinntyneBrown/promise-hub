import { test, expect } from '../../fixtures/test';
import { AuditLogPage } from '../../pages/audit-log.page';

// L2-032 audit trail, L2-007 roles, L2-001 tenants, L2-035/L2-036.
test.describe('Review audit history as an admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given the last 7 days, when the log opens, then who did what shows newest first', async ({ page }) => {
    const log = new AuditLogPage(page);

    await log.open();

    await expect(log.rows()).toHaveCount(3);
    await expect(log.rows().first()).toContainText('Carmen Rivera');
    await log.expectAccessible();
    await log.expectNoHorizontalScroll();
  });

  test('Given a search and an action, when applied, then only matching entries remain', async ({ page }) => {
    const log = new AuditLogPage(page);
    await log.open();

    await log.search('Mateo');
    await expect(log.rows()).toHaveCount(2);
    await log.action('Viewed');

    await expect(log.rows()).toHaveCount(1);
    await expect(log.rows().first()).toContainText('medical details');
  });

  // Traces to: L2-047 criterion 5 — the lock is audited in the youth's organization.
  test('Given Sofía locked herself out, when Tom filters by Sign-in locked, then the lock shows with her name', async ({ page, api }) => {
    api.failSignIn('sofia@harbourview.example', 5);
    const log = new AuditLogPage(page);
    await log.open();

    await log.action('Sign-in locked');

    await expect(log.rows()).toHaveCount(1);
    await expect(log.rows().first()).toContainText('Sofía Rivera');
    await expect(log.rows().first()).toContainText('Sign-in locked after 5 failed attempts');
  });

  test('Given a wider period, when chosen, then older entries appear and export follows the filters', async ({ page }) => {
    const log = new AuditLogPage(page);
    await log.open();

    await log.period('Last 30 days');
    await log.search('report');

    await expect(log.rows()).toHaveCount(1);
    await expect(log.export).toHaveAttribute('href', /\/api\/audit\/export\?.*q=report.*days=30|\/api\/audit\/export\?.*days=30.*q=report/);
  });

  test('Given nothing matches, when searched, then it says so', async ({ page }) => {
    const log = new AuditLogPage(page);
    await log.open();

    await log.search('Petrov');

    await expect(log.emptyHeading(/No entries for “Petrov”/)).toBeVisible();
  });
});

test.describe('Program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a director, when the log opens, then it says admins read it', async ({ page }) => {
    const log = new AuditLogPage(page);

    await log.open();

    await expect(log.forbidden).toBeVisible();
  });
});

test.describe('Another organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate, when the log opens, then only its own entries show', async ({ page }) => {
    const log = new AuditLogPage(page);

    await log.open();

    await expect(log.rows()).toHaveCount(1);
    await expect(log.rows().first()).toContainText('Grace Mensah');
  });
});
