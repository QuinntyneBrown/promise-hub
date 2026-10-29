import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentoringPage } from '../../pages/mentoring.page';

// Acceptance test. Traces to: L2-125 criteria 3 and 4 (the youth due a mentor check-in under the organization's cadence on the mentor
// dashboard, never-checked-in first, then the oldest; another mentor's check-ins never count), L2-063, L2-035, L2-036.
const ALL: ModuleId[] = [
  'Roster',
  'Slips',
  'RollCall',
  'QuickCards',
  'Pickup',
  'Messages',
  'Incidents',
  'Reports',
  'Learning',
  'Mentoring',
];

test.describe('Check-ins due on the mentor dashboard', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', ALL);
    api.assignYouthMentor('c-mateo', 'm-daniel');
    api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
  });

  test('Given mentors check in every 14 days, when Daniel opens Mentoring, then Check-ins due lists his youth without one, never-checked-in first', async ({
    page,
    api,
  }) => {
    api.mentorCheckIns.seed({
      childId: 'c-mateo',
      youthName: 'Mateo Rivera',
      mentorId: 'm-daniel',
      date: '2026-11-01',
      kind: 'Call',
      engagement: 'Steady',
    });
    api.mentorCheckIns.seed({
      childId: 'c-jordan',
      youthName: 'Jordan Thompson',
      mentorId: 'm-daniel',
      date: '2026-10-20',
      kind: 'OneToOne',
      engagement: 'Steady',
    });
    api.mentorCheckIns.seed({
      childId: 'c-sofia',
      youthName: 'Sofía Rivera',
      mentorId: 'm-hana',
      date: '2026-11-04',
      kind: 'Call',
      engagement: 'Steady',
    });
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.checkInsDue).toHaveCount(3);
    await expect(mentoring.checkInsDue.nth(0)).toContainText('Sofía Rivera');
    await expect(mentoring.checkInsDue.nth(1)).toContainText('Yusuf Haddad');
    await expect(mentoring.checkInsDue.nth(2)).toContainText('Jordan Thompson');
    await expect(mentoring.checkInsDue.nth(0)).toContainText('No mentor check-in yet');
    await expect(mentoring.checkInsDue.nth(2)).toContainText('Last mentor check-in Tue 20 Oct');
    await expect(mentoring.checkInsDueCard).toContainText(
      'Your organization asks for a mentor check-in every 14 days.',
    );
    await mentoring.expectNoHorizontalScroll();
    await mentoring.expectAccessible();
  });

  test('Given the organization asks every 30 days and he has checked in with each youth within that, then none are due', async ({
    page,
    api,
  }) => {
    api.setMentorCheckInDays('org-harbourview', 30);
    for (const [childId, youthName] of [
      ['c-mateo', 'Mateo Rivera'],
      ['c-jordan', 'Jordan Thompson'],
      ['c-sofia', 'Sofía Rivera'],
      ['c-yusuf', 'Yusuf Haddad'],
    ] as const)
      api.mentorCheckIns.seed({
        childId,
        youthName,
        mentorId: 'm-daniel',
        date: '2026-10-20',
        kind: 'Call',
        engagement: 'Steady',
      });
    const mentoring = new MentoringPage(page);

    await mentoring.open();

    await expect(mentoring.noCheckInsDue).toBeVisible();
    await mentoring.expectAccessible();
  });
});
