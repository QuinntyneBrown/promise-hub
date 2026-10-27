import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentoringPage } from '../../pages/mentoring.page';
import { MentorGroupPage } from '../../pages/mentor-group.page';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';

// Acceptance tests. Traces to: L2-065 (role-scoped data visibility for mentors), L2-063 criterion 1 (cohorts link to their page).
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];

test.describe('A cohort the mentor is on', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Daniel supports After-School Tutoring, when he opens it from My cohorts, then he sees its mentors and members and can open a member', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
    api.assignYouthMentor('c-mateo', 'm-daniel');
    const mentoring = new MentoringPage(page);
    const group = new MentorGroupPage(page);
    await mentoring.open();

    await mentoring.openCohort('After-School Tutoring');

    await group.expectOpen('After-School Tutoring');
    await expect(group.subtitle).toContainText('Mon–Thu, 4–6 pm');
    await expect(group.subtitle).toContainText('You’re a supporting mentor');
    await expect(group.mentors).toHaveCount(2);
    await expect(group.mentors.first()).toContainText('Hana Kim');
    await expect(group.members).toHaveText(['Jordan Thompson', 'Mateo Rivera', 'Sofía Rivera', 'Yusuf Haddad']);
    await expect(group.member('Mateo Rivera')).toContainText('Mentor: Daniel Osei');
    await expect(group.member('Jordan Thompson')).toContainText('No mentor');
    await group.expectAccessible();

    await group.openMember('Jordan Thompson');
    await new MentorYouthDetailPage(page).expectOpen('Jordan Thompson');
  });

  test('Given Daniel leads Winter Camp with nobody enrolled, when it opens, then it says there are no youth yet', async ({ page, api }) => {
    api.setCohortTeam('p-winter', 'm-daniel');
    const group = new MentorGroupPage(page);

    await group.open('p-winter');

    await expect(group.subtitle).toContainText('You’re the lead mentor');
    await expect(group.noMembers).toBeVisible();
    await group.expectAccessible();
  });

  test('Given a cohort Daniel is not on, when he opens it, then it says he is not a mentor on it and the API answers 403', async ({ page, api }) => {
    api.setCohortTeam('p-tutoring', 'm-hana');
    const group = new MentorGroupPage(page);

    await group.open('p-sports');

    await expect(group.forbidden).toBeVisible();
    expect(await group.apiStatus('p-sports')).toBe(403);
    expect(await group.apiStatus('p-kids-club')).toBe(404);
    await group.expectAccessible();
  });

  test('Given the cohort fails to load, when Daniel tries again, then it loads', async ({ page, api }) => {
    api.setCohortTeam('p-sports', 'm-daniel');
    api.failNext('/api/mentoring/cohorts/p-sports', 500);
    const group = new MentorGroupPage(page);

    await group.open('p-sports');
    await expect(group.failed).toBeVisible();
    api.recover('/api/mentoring/cohorts/p-sports');
    await group.retry();

    await group.expectOpen('Saturday Sports');
  });

  test('Given Mentoring is off, when a cohort page is opened, then Today opens and the API answers 404', async ({ page, api }) => {
    api.setCohortTeam('p-sports', 'm-daniel');
    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Mentoring'));
    const group = new MentorGroupPage(page);

    await group.open('p-sports');

    await expect(page).toHaveURL(/\/$/);
    expect(await group.apiStatus('p-sports')).toBe(404);
  });
});
