import { test, expect } from '../../fixtures/test';
import { AcceptInvitePage } from '../../pages/accept-invite.page';
import { LearningPage } from '../../pages/learning.page';
import { MentoringPage } from '../../pages/mentoring.page';
import { TodayPage } from '../../pages/today.page';

// Acceptance Test
// Traces to: L2-052, L2-046, L2-035, L2-036
// Description: an invited youth or mentor accepts, sets a password and lands on the home of their role.
test.describe('Accept an invitation as a youth or mentor', () => {
  test.use({ signedInAs: null });

  test('Given Yusuf’s invitation from his child record, when he accepts, then he is signed in as a Youth and lands on Learning', async ({ page, api }) => {
    api.sentInvitation('inv-yusuf', 'yusuf.haddad@example.com', 'Youth', false, { childId: 'c-yusuf', suggestedName: 'Yusuf Haddad' });
    const invite = new AcceptInvitePage(page);
    await invite.open('inv-yusuf');
    await expect(invite.heading).toHaveText('Join Harbourview Youth Collective');
    await expect(invite.subtitle).toHaveText('Tom Nguyen invited you to Learning as a Youth.');
    await expect(invite.nameField).toHaveValue('Yusuf Haddad');
    await invite.expectAccessible();
    await invite.expectNoHorizontalScroll();

    await invite.accept('Yusuf Haddad', 'lanterns over the harbour', 'Join and start Learning');

    await new LearningPage(page).expectOpen();
    expect(api.youthLinkOf('yusuf.haddad@example.com')).toBe('c-yusuf');
  });

  test('Given Learning was turned off after the invitation, when Yusuf accepts, then he lands on Today', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Mentoring']);
    api.sentInvitation('inv-yusuf', 'yusuf.haddad@example.com', 'Youth', false, { childId: 'c-yusuf', suggestedName: 'Yusuf Haddad' });
    const invite = new AcceptInvitePage(page);
    const requested = invite.recordApiPaths();
    await invite.open('inv-yusuf');

    await invite.accept('Yusuf Haddad', 'lanterns over the harbour', 'Join and start Learning');

    await expect(new TodayPage(page).heading).toHaveText('Welcome, Yusuf');
    await expect(page).toHaveURL(/\/$/);
    expect(requested.filter((p) => p.startsWith('/api/learning'))).toEqual([]);
    expect(await new LearningPage(page).apiStatus()).toBe(404);
  });

  test('Given Grace’s mentor invitation, when she accepts, then she is signed in as a Mentor and lands on Mentoring', async ({ page, api }) => {
    api.sentInvitation('inv-grace', 'grace.adeyemi@example.org', 'Mentor');
    const invite = new AcceptInvitePage(page);
    await invite.open('inv-grace');
    await expect(invite.subtitle).toHaveText('Tom Nguyen invited you as Mentor.');

    await invite.accept('Grace Adeyemi', 'mentoring on thursdays');

    await new MentoringPage(page).expectOpen();
  });

  test('Given a volunteer invitation, when Ravi accepts, then he lands on Today', async ({ page, api }) => {
    api.sentInvitation('inv-ravi', 'ravi.patel@example.org', 'Volunteer');
    const invite = new AcceptInvitePage(page);
    await invite.open('inv-ravi');

    await invite.accept('Ravi Patel', 'saturday sports helper');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Ravi');
  });
});
