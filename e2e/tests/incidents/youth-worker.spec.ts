import { test, expect } from '../../fixtures/test';
import { IncidentsPage } from '../../pages/incidents.page';
import { NewIncidentPage } from '../../pages/new-incident.page';

// L2-023 criteria 1, 3 and 8 for youth workers, L2-007 roles, L2-035/L2-036 accessibility and phone layout.
test.describe('Report an incident as a youth worker', () => {
  test.use({ signedInAs: 'm-aisha' });

  test('Given Aisha in a session, when she reports Jordan’s allergic reaction, then it needs review and she can open it', async ({ page }) => {
    const form = new NewIncidentPage(page);
    await form.open();
    await form.expectAccessible();

    await form.fill({
      type: 'Illness or allergic reaction',
      child: 'Jordan Thompson',
      when: '2026-10-21T17:15',
      where: 'Room 2',
      what: 'Jordan’s lips swelled after snack.',
      did: 'Gave his antihistamine and called Dana.',
      guardian: 'Called and reached',
      severity: 'Moderate',
    });
    await form.submit();

    const incident = new IncidentsPage(page);
    await expect(incident.heading).toHaveText('Illness or allergic reaction · Jordan Thompson');
    await expect(incident.status).toHaveText('Needs review');
  });

  test('Given a report by Jaylen, when Aisha opens the log or follows its link, then she sees only her own and the report is not found', async ({ page, api }) => {
    const jaylens = api.reportIncident('m-jaylen', 'Injury', 'c-mateo');
    api.reportIncident('m-aisha', 'Behaviour', 'c-jordan');
    const log = new IncidentsPage(page);

    await log.open();
    await expect(log.forbidden).toBeVisible();
    await expect(log.list('Your reports').getByRole('listitem')).toHaveCount(1);
    await expect(log.list('Your reports')).not.toContainText('Mateo Rivera');
    await log.expectAccessible();
    await log.expectNoHorizontalScroll();

    await log.openIncident(jaylens);
    await expect(log.heading).toHaveText('We can’t find that incident');
  });

});
