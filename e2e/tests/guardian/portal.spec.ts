import { test, expect } from '../../fixtures/test';
import { GuardianHomePage } from '../../pages/guardian-home.page';
import { GuardianChildPage } from '../../pages/guardian-child.page';

// Acceptance Test
// Traces to: L2-102, L2-104, L2-026, L2-027, L2-005, L2-001, L2-035, L2-036
// Description: A guardian uses the guardian portal from the household link: each child's page, read only.
test.describe('Use the guardian portal', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.trustGuardianDevice('hh-rivera');
  });

  test('Given Carmen’s verified household link, when she opens it, then each child is listed with their programs and links to their page', async ({ page }) => {
    const home = new GuardianHomePage(page);

    await home.open('tok-home-rivera');

    await expect(home.child('Mateo Rivera')).toContainText('After-School Tutoring');
    await expect(home.child('Sofía Rivera')).toContainText('After-School Tutoring');
    await home.expectAccessible();
    await expect(home.childLink('Sofía Rivera')).toHaveAttribute('href', '/g/home/tok-home-rivera/children/c-sofia');
  });

  test('Given Sofía’s consent and the field trip slip, when Carmen opens Sofía, then her schedule and consents show read only', async ({ page, api }) => {
    api.giveConsent('c-sofia');
    api.sendSlip('e-rbg');
    api.answerSlip('e-rbg', 'c-mateo', 'Signed');
    const home = new GuardianHomePage(page);
    await home.open('tok-home-rivera');

    await home.openChild('Sofía Rivera');
    const child = new GuardianChildPage(page);
    await child.expectLoaded();

    await expect(child.heading).toHaveText('Sofía');
    await expect(child.session('Tutoring night')).toContainText('Today');
    await expect(child.session('Fall field trip: Royal Botanical Gardens')).toBeVisible();
    await expect(child.consent('Taking part in Learning and mentoring')).toContainText('Given');
    await expect(child.consent('Taking part in Learning and mentoring')).toContainText('Signed by Carmen Rivera (Parent)');
    await expect(child.consent('Fall field trip')).toContainText('Not signed yet');
    await expect(child.consent('Fall field trip')).toContainText('Sign by');
    expect(await child.controlCount()).toBe(0);
    await child.expectAccessible();
    await child.expectNoHorizontalScroll();
  });

  test('Given Mateo signed for and no youth account, when Carmen opens Mateo, then the slip is signed and there is no participation consent', async ({ page, api }) => {
    api.sendSlip('e-rbg');
    api.answerSlip('e-rbg', 'c-mateo', 'Signed');
    const child = new GuardianChildPage(page);

    await child.open('tok-home-rivera', 'c-mateo');

    await expect(child.consent('Fall field trip')).toContainText('Signed');
    await expect(child.consent('Taking part in Learning and mentoring')).toHaveCount(0);
  });

  test('Given staff cancelled the field trip, when Carmen opens Sofía, then it stays on the schedule marked Cancelled', async ({ page, api }) => {
    api.cancelSession('e-rbg');
    const child = new GuardianChildPage(page);

    await child.open('tok-home-rivera', 'c-sofia');

    await expect(child.session('Fall field trip: Royal Botanical Gardens')).toContainText('Cancelled');
  });

  test('Given a child in no program, when the page opens, then each section says so in words', async ({ page, api }) => {
    api.unenrollHousehold('hh-rivera');
    const child = new GuardianChildPage(page);

    await child.open('tok-home-rivera', 'c-mateo');

    await expect(child.text('Nothing scheduled in the next four weeks.')).toBeVisible();
    await expect(child.text('Nothing to sign right now.')).toBeVisible();
    await child.expectAccessible();
  });

  test('Given Sofía’s marked sessions, lessons and badges, when Carmen opens Sofía, then attendance and Learning progress show, read only', async ({ page, api }) => {
    api.curriculumState.youthJourney();
    api.learningState.completeOn('m-sofia', '2026-11-03T16:00:00Z', 'l-strengths', 'l-values', 'l-towel');
    api.recordAttendance('e-tutoring-yesterday', 'c-sofia', 'Absent', null, { excused: true });
    api.recordAttendance('e-tutoring-today', 'c-sofia', 'Present', '2026-11-05T21:10:00Z', { late: true });
    const child = new GuardianChildPage(page);

    await child.open('tok-home-rivera', 'c-sofia');

    await expect(child.attendance).toContainText('50%');
    await expect(child.attendance).toContainText('1 of 2 sessions');
    await expect(child.attendanceRow('Wed 4 Nov')).toContainText('Excused');
    await expect(child.attendanceRow('Thu 5 Nov')).toContainText('Late');
    await expect(child.learning).toContainText('3 of');
    await expect(child.module('Knowing Yourself')).toContainText('Complete');
    await expect(child.module('Leading by Serving')).toContainText('In progress');
    await expect(child.badges.getByRole('listitem').first()).toBeVisible();
    await expect(child.learning).toContainText('stay between Sofía and their mentor');
    expect(await child.controlCount()).toBe(0);
    await child.expectAccessible();
    await child.expectNoHorizontalScroll();
  });

  test('Given Mateo has no youth account, or Learning and Roll Call are off, when the page opens, then there is no Learning or Attendance section', async ({ page, api }) => {
    const child = new GuardianChildPage(page);

    await child.open('tok-home-rivera', 'c-mateo');
    await expect(child.learning).toHaveCount(0);
    await expect(child.attendance).toBeVisible();

    api.setModules('org-harbourview', ['Roster', 'Slips', 'Messages']);
    await child.open('tok-home-rivera', 'c-sofia');
    await expect(child.learning).toHaveCount(0);
    await expect(child.attendance).toHaveCount(0);
    await expect(child.schedule).toBeVisible();
  });

  test('Given another family’s child, an expired link or Roster off, when the page opens, then it is not shown', async ({ page, api }) => {
    const child = new GuardianChildPage(page);

    await child.open('tok-home-rivera', 'c-jordan');
    await expect(child.heading).toHaveText('This page isn’t available');

    await child.open('not-a-real-token', 'c-sofia');
    await expect(child.heading).toHaveText('This link has expired');

    api.setModules('org-harbourview', []);
    await child.open('tok-home-rivera', 'c-sofia');
    await expect(child.heading).toHaveText('This page isn’t available');
  });
});

test.describe('Use the guardian portal in the household’s language', () => {
  test.use({ signedInAs: null });

  test('Given a Spanish-speaking household on a new device, when Carmen opens Sofía and verifies, then the page is in Spanish', async ({ page, api }) => {
    const child = new GuardianChildPage(page);
    const home = new GuardianHomePage(page);

    await child.open('tok-home-rivera', 'c-sofia');
    await home.verify('905-555-0142', api.guardianCode);
    await child.expectLoaded();

    await expect(child.heading).toHaveText('Sofía');
    await expect(child.schedule).toBeVisible();
    await expect(child.session('Tutoring night')).toContainText('Hoy');
    expect(await child.language).toBe('es');
  });
});
