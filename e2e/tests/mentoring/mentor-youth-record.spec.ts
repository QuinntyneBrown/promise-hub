import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';
import { MentorYouthPage } from '../../pages/mentor-youth.page';

// Acceptance tests. Traces to: L2-064 (youth record for a mentor), L2-065 criterion 4, L2-007 criterion 1, L2-019 criterion 3.
const ALL: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];

test.describe('A youth’s record for their mentor', () => {
  test.use({ signedInAs: 'm-daniel' });

  test('Given Daniel mentors Mateo, when he opens Mateo from My youth, then he sees programs, mentor, guardians and attendance and nothing medical', async ({ page, api }) => {
    api.assignYouthMentor('c-mateo', 'm-daniel');
    api.recordAttendance('e-tutoring-yesterday', 'c-mateo', 'Absent', null);
    api.recordAttendance('e-tutoring-today', 'c-mateo', 'Present', '2026-11-05T21:02:00Z');
    const myYouth = new MentorYouthPage(page);
    const record = new MentorYouthDetailPage(page);
    await myYouth.open();

    await myYouth.openYouth('Mateo Rivera');

    await record.expectOpen('Mateo Rivera');
    await expect(record.subtitle).toHaveText('Age 9 · Bennetto Elementary, Grade 4');
    await expect(record.fact('Programs')).toHaveText('After-School Tutoring');
    await expect(record.fact('Mentor')).toHaveText('Daniel Osei');
    await expect(record.fact('Goes by')).toHaveText('Not set');
    await expect(record.guardians).toHaveCount(2);
    await expect(record.guardians.first()).toContainText('Carmen Rivera');
    await expect(record.guardians.first()).toContainText('carmen.rivera@example.com');
    await expect(record.guardians.nth(1)).toContainText('Luis Rivera');
    await expect(record.call('905-555-0142')).toHaveAttribute('href', 'tel:905-555-0142');
    await expect(record.attendance).toHaveCount(3);
    await expect(record.attendance.nth(1)).toContainText('Checked in');
    await expect(record.attendance.nth(2)).toContainText('Absent');
    await expect(record.restrictedNote).toBeVisible();
    const text = await record.text();
    for (const restricted of ['Peanuts', 'EpiPen', '2017', '4471', 'Sits with Jordan']) expect(text).not.toContain(restricted);
    await record.expectAccessible();
  });

  test('Given Sofía finished setup, when her mentor opens her record, then it shows the name she goes by and her pronouns', async ({ page, api }) => {
    api.assignYouthMentor('c-sofia', 'm-daniel');
    api.saveOnboarding('m-sofia', { step: 3, preferredName: 'Sofi', pronouns: 'she/her', completed: true });
    const record = new MentorYouthDetailPage(page);

    await record.open('c-sofia');

    await expect(record.fact('Goes by')).toHaveText('Sofi');
    await expect(record.fact('Pronouns')).toHaveText('she/her');
  });

  test('Given Roll Call is off, when the record opens, then no attendance card renders', async ({ page, api }) => {
    api.assignYouthMentor('c-mateo', 'm-daniel');
    api.setModules('org-harbourview', ['Roster', 'Slips', 'QuickCards', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring']);
    const record = new MentorYouthDetailPage(page);

    await record.open('c-mateo');

    await record.expectOpen('Mateo Rivera');
    await expect(record.attendanceHeading).toHaveCount(0);
  });

  test('Given Amara is not assigned to Daniel, when he opens her record, then it says she isn’t assigned to him and the API answers 403', async ({ page, api }) => {
    api.assignYouthMentor('c-mateo', 'm-daniel');
    const record = new MentorYouthDetailPage(page);

    await record.open('c-amara');

    await expect(record.forbidden).toBeVisible();
    expect(await record.text()).not.toContain('Amara');
    expect(await record.apiStatus('c-amara')).toBe(403);
    await record.expectAccessible();
  });

  test('Given the record fails to load, when Daniel tries again, then it loads', async ({ page, api }) => {
    api.assignYouthMentor('c-mateo', 'm-daniel');
    api.failNext('/api/mentoring/youth/c-mateo', 500);
    const record = new MentorYouthDetailPage(page);

    await record.open('c-mateo');
    await expect(record.failed).toBeVisible();
    api.recover('/api/mentoring/youth/c-mateo');
    await record.retry();

    await record.expectOpen('Mateo Rivera');
  });

  test('Given a Northgate child or Mentoring off, when the record is requested, then the API answers 404 and the route goes to Today', async ({ page, api }) => {
    api.assignYouthMentor('c-mateo', 'm-daniel');
    const record = new MentorYouthDetailPage(page);
    await record.open('c-mateo');
    await record.expectOpen('Mateo Rivera');
    expect(await record.apiStatus('c-ng-mateo')).toBe(404);

    api.setModules('org-harbourview', ALL.filter((m) => m !== 'Mentoring'));
    await record.open('c-mateo');

    await expect(page).toHaveURL(/\/$/);
    expect(await record.apiStatus('c-mateo')).toBe(404);
  });
});

test.describe('A youth’s mentor record for staff', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given a site lead, when the mentor record endpoint is called, then it answers 403', async ({ page, api }) => {
    api.assignYouthMentor('c-mateo', 'm-daniel');
    const record = new MentorYouthDetailPage(page);
    await page.goto('/');

    expect(await record.apiStatus('c-mateo')).toBe(403);
  });
});
