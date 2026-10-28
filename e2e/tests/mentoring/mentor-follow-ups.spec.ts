import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';
import { MentoringPage } from '../../pages/mentoring.page';

// Acceptance test. Traces to: L2-090 criteria 6 and 9 (follow-ups from his latest mentor check-in of each youth on the dashboard, soonest
// first, overdue ones marked, none planned), L2-063, L2-035, L2-036.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];

test.describe('Follow-ups on the mentor dashboard', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.assignYouthMentor('c-mateo', 'm-daniel');
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
  });

  test('Given his latest mentor check-ins carry follow-up dates, when Daniel opens Mentoring, then Follow-ups lists them soonest first with the overdue one marked', async ({
    page,
    api,
  }) => {
    api.mentorCheckIns.seed({ childId: 'c-mateo', youthName: 'Mateo Rivera', mentorId: 'm-daniel', date: '2026-10-29', kind: 'Call', engagement: 'Low', followUpOn: '2026-11-02' });
    api.mentorCheckIns.seed({ childId: 'c-mateo', youthName: 'Mateo Rivera', mentorId: 'm-daniel', date: '2026-11-05', kind: 'OneToOne', engagement: 'Engaged', followUpOn: '2026-11-12' });
    api.mentorCheckIns.seed({ childId: 'c-yusuf', youthName: 'Yusuf Haddad', mentorId: 'm-daniel', date: '2026-11-04', kind: 'Call', engagement: 'Low', followUpOn: '2026-11-10' });
    api.mentorCheckIns.seed({ childId: 'c-jordan', youthName: 'Jordan Thompson', mentorId: 'm-daniel', date: '2026-10-29', kind: 'OneToOne', engagement: 'Steady', followUpOn: '2026-11-03' });
    api.mentorCheckIns.seed({ childId: 'c-sofia', youthName: 'Sofía Rivera', mentorId: 'm-hana', date: '2026-11-05', kind: 'Call', engagement: 'Steady', followUpOn: '2026-11-06' });
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.followUps).toHaveCount(3);
    await expect(mentoring.followUps.nth(0)).toContainText('Jordan Thompson');
    await expect(mentoring.followUps.nth(0)).toContainText('Overdue · Tue 3 Nov');
    await expect(mentoring.followUps.nth(1)).toContainText('Yusuf Haddad');
    await expect(mentoring.followUps.nth(1)).toContainText('Tue 10 Nov');
    await expect(mentoring.followUps.nth(2)).toContainText('Mateo Rivera');
    await expect(mentoring.followUps.nth(2)).toContainText('Thu 12 Nov');
    await mentoring.expectNoHorizontalScroll();
    await mentoring.expectAccessible();

    await mentoring.openFollowUp('Mateo Rivera');

    await new MentorYouthDetailPage(page).expectOpen('Mateo Rivera');
  });

  test('Given no mentor check-in of his has a follow-up date, when he opens Mentoring, then Follow-ups says none are planned', async ({ page, api }) => {
    api.mentorCheckIns.seed({ childId: 'c-mateo', youthName: 'Mateo Rivera', mentorId: 'm-daniel', date: '2026-11-05', kind: 'OneToOne', engagement: 'Engaged' });
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.noFollowUps).toBeVisible();
    await mentoring.expectAccessible();
  });
});
