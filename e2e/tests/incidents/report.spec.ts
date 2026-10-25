import { test, expect } from '../../fixtures/test';
import { IncidentsPage } from '../../pages/incidents.page';
import { NewIncidentPage } from '../../pages/new-incident.page';
import { TodayPage } from '../../pages/today.page';

// L2-023 reporting incidents, L2-007 roles, L2-005 Incident log off, L2-035/L2-036 accessibility and phone layout.
const mateo = {
  type: 'Injury',
  child: 'Mateo Rivera',
  when: '2026-10-21T18:40',
  where: 'Stairwell',
  what: 'Mateo slipped on the stairs and hit his knee.',
  did: 'Ice pack for ten minutes; he went back to tutoring.',
  guardian: 'Called and reached',
  severity: 'Minor',
};

test.describe('Report an incident as a site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given the facts are missing, when the report is submitted, then each is named and nothing is saved', async ({ page }) => {
    const form = new NewIncidentPage(page);
    await form.open();
    await expect(form.supervisorNote).toContainText('Marisol Delgado');
    await form.expectAccessible();
    await form.expectNoHorizontalScroll();

    await form.submit();

    await expect(form.errorSummary).toContainText('Describe what happened.');
    await expect(form.errorSummary).toContainText('Choose the child involved.');
    await form.expectAccessible();
    const log = new IncidentsPage(page);
    await log.open();
    await expect(log.list('Your reports').getByRole('listitem')).toHaveCount(1);
    await expect(log.list('Your reports')).toContainText('No reports yet');
  });

  test('Given a complete report, when it is submitted, then it needs review and goes to the supervisor', async ({ page }) => {
    const form = new NewIncidentPage(page);
    await form.open();

    await form.fill(mateo);
    await form.submit();

    await expect(page.getByRole('status').filter({ hasText: 'Report sent' })).toContainText('Marisol Delgado');
    const incident = new IncidentsPage(page);
    await expect(incident.heading).toHaveText('Injury · Mateo Rivera');
    await expect(incident.status).toHaveText('Needs review');
    await expect(incident.facts()).toContainText('Ice pack for ten minutes');
    await incident.expectAccessible();
  });

  test('Given reports by Jaylen and Aisha, when Jaylen opens the log, then he sees only his own and cannot open hers', async ({ page, api }) => {
    api.reportIncident('m-jaylen', 'Injury', 'c-mateo');
    const aishas = api.reportIncident('m-aisha', 'Behaviour', 'c-jordan');
    const log = new IncidentsPage(page);

    await log.open();

    await expect(log.forbidden).toBeVisible();
    await expect(log.list('Your reports').getByRole('listitem')).toHaveCount(1);
    await expect(log.list('Your reports')).toContainText('Mateo Rivera');
    await log.expectAccessible();
    await log.openIncident(aishas);
    await expect(log.heading).toHaveText('We can’t find that incident');
  });
});

test.describe('The incident log for supervisors', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given reports by two staff, when Marisol opens the log, then both are listed', async ({ page, api }) => {
    api.reportIncident('m-jaylen', 'Injury', 'c-mateo');
    api.reportIncident('m-aisha', 'Behaviour', 'c-jordan');
    const log = new IncidentsPage(page);

    await log.open();

    await expect(log.heading).toHaveText('Incident log');
    await expect(log.list('Incidents').getByRole('listitem')).toHaveCount(2);
    await log.expectAccessible();
  });
});

test.describe('The incident log when its module is off', () => {
  test('Given the Incident log is off, when an incident page is opened, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster']);

    await page.goto('/incidents/new');

    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
