// Screen recordings and screenshots for video 54, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol gives After-School Tutoring a term, sets its
// mentors, assigns Daniel to Mateo, and Daniel sees his youth (L2-061, L2-062).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const suite = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];
const org = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };
const marisol = (mentoring) => ({ personName: 'Marisol Delgado', role: 'ProgramDirector', ...org, modules: mentoring ? [...suite, 'Mentoring'] : suite });
const daniel = { personName: 'Daniel Osei', role: 'Mentor', ...org, modules: ['Roster', 'Mentoring'] };
const mentors = [
  { id: 'm-daniel', name: 'Daniel Osei' },
  { id: 'm-hana', name: 'Hana Kim' },
];
const youth = [
  { childId: 'c-yusuf', name: 'Yusuf Haddad', householdId: 'h-haddad', age: 13, householdName: 'Haddad' },
  { childId: 'c-mateo', name: 'Mateo Rivera', householdId: 'h-rivera', age: 9, householdName: 'Rivera' },
  { childId: 'c-sofia', name: 'Sofía Rivera', householdId: 'h-rivera', age: 12, householdName: 'Rivera' },
  { childId: 'c-jordan', name: 'Jordan Thompson', householdId: 'h-thompson', age: 11, householdName: 'Thompson' },
];

const newState = (extra = {}) => ({ term: null, lead: null, supporting: [], assigned: {}, failNext: null, mentoring: true, ...extra });

/** The API as the real one answers it; `state` holds the term, the team, each youth's mentor and a pending fault. */
async function fakeApi(demo, state, me = () => marisol(state.mentoring)) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const byId = (id) => mentors.find((m) => m.id === id) ?? null;
    if (state.failNext && path.endsWith(state.failNext) && method === 'PUT') {
      state.failNext = null;
      return route.fulfill({ status: 500, json: { code: 'server-error', reference: 'ERR-4M7C' } });
    }
    if (path === '/api/me') return route.fulfill({ json: me() });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/programs' && method === 'GET') {
      return route.fulfill({
        json: {
          programs: [
            { id: 'p-tutoring', name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24', enrolled: 4, capacity: 50, enrollmentOpen: true, status: 'Active', term: state.term },
            { id: 'p-sports', name: 'Saturday Sports', schedule: 'Sat, 10 am–12 pm', startsOn: '2026-09-12', endsOn: '2027-05-29', enrolled: 2, capacity: 80, enrollmentOpen: true, status: 'Active', term: null },
          ],
          active: 2,
          archived: 1,
          enrolled: 6,
        },
      });
    }
    if (path === '/api/programs/p-tutoring' && method === 'GET') {
      if (state.programFails) return route.fulfill({ status: 500, json: { code: 'server-error', reference: 'ERR-4M7C' } });
      return route.fulfill({
        json: {
          id: 'p-tutoring', name: 'After-School Tutoring', startsOn: '2026-09-08', endsOn: '2027-06-24', schedule: 'Mon–Thu, 4–6 pm', capacity: 50, ages: '6–13',
          enrollmentOpen: true, seasonConsent: true, status: 'Active', enrolled: 4, term: state.term,
          roster: [...youth].sort((a, b) => a.name.split(' ')[1].localeCompare(b.name.split(' ')[1]) || a.name.localeCompare(b.name)).map((y) => ({ id: y.childId, householdId: y.householdId, name: y.name, age: y.age, householdName: y.householdName })),
          events: [{ id: 'e-tutoring-today', name: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', status: 'Scheduled' }],
          archivedAt: null, archivedBy: null, enrollmentUrl: 'http://localhost:4317/g/enroll/tutoring', pendingReviews: 0, waitlisted: 0,
        },
      });
    }
    if (path === '/api/programs/p-tutoring' && method === 'PUT') {
      const b = route.request().postDataJSON();
      if ((b.term ?? '').trim().length > 40) return route.fulfill({ status: 422, json: { errors: { term: 'Keep the term under 40 characters.' } } });
      state.term = b.term?.trim() || null;
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/programs/p-tutoring/mentoring') {
      if (!state.mentoring) return route.fulfill({ status: 404 });
      return route.fulfill({
        json: {
          programId: 'p-tutoring',
          lead: byId(state.lead),
          supporting: state.supporting.map(byId),
          youth: youth.map((y) => ({ childId: y.childId, name: y.name, mentor: byId(state.assigned[y.childId]) })),
          mentors,
        },
      });
    }
    if (path === '/api/programs/p-tutoring/mentors') {
      const b = route.request().postDataJSON();
      if (!b.leadMentorId) return route.fulfill({ status: 422, json: { errors: { leadMentorId: 'Choose a lead mentor.' } } });
      state.lead = b.leadMentorId;
      state.supporting = b.supportingMentorIds;
      return route.fulfill({ status: 204 });
    }
    const assign = /^\/api\/programs\/p-tutoring\/youth\/([^/]+)\/mentor$/.exec(path);
    if (assign) {
      if (method === 'DELETE') {
        delete state.assigned[assign[1]];
        return route.fulfill({ status: 204 });
      }
      const { mentorId } = route.request().postDataJSON();
      if (!mentorId) return route.fulfill({ status: 422, json: { errors: { mentorId: 'Choose a mentor.' } } });
      state.assigned[assign[1]] = mentorId;
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/mentoring/youth') {
      const ids = new Set(Object.entries(state.assigned).filter(([, m]) => m === 'm-daniel').map(([c]) => c));
      if (state.lead === 'm-daniel' || state.supporting.includes('m-daniel')) youth.forEach((y) => ids.add(y.childId));
      return route.fulfill({ json: { youth: youth.filter((y) => ids.has(y.childId)).map((y) => ({ id: y.childId, name: y.name })).sort((a, b) => a.name.localeCompare(b.name)) } });
    }
    return route.fulfill({ status: 404 });
  });
}

const heading = (demo, level, name) => demo.app().getByRole('heading', { level, name }).waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => demo.app().getByRole('dialog');

export default [
  {
    // Marisol gives After-School Tutoring its term; the header and the Programs row show it.
    name: 'term-desktop',
    run: async (demo) => {
      const state = newState({ lead: 'm-daniel', supporting: ['m-hana'] });
      await fakeApi(demo, state);
      await demo.go('/programs/p-tutoring', { ready: false });
      await heading(demo, 1, 'After-School Tutoring');
      demo.mark();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('link', { name: 'Edit', exact: true }));
      await heading(demo, 1, 'Edit program');
      await demo.app().getByLabel('Program name').waitFor();
      await demo.pause(800);
      await demo.type(demo.app().getByLabel('Term (optional)'), '2026–27');
      await demo.pause(600);
      await shot(demo, 'desktop-program-form-term');
      await demo.click(demo.app().getByRole('button', { name: 'Save program' }));
      await heading(demo, 1, 'After-School Tutoring');
      await demo.app().getByText('2026–27 term').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-program-term');
      await demo.go('/programs', { ready: false });
      await heading(demo, 1, 'Programs');
      await demo.app().getByText('Mon–Thu, 4–6 pm · 2026–27 · 4 of 50 enrolled').waitFor();
      await demo.pause(1800);
    },
  },
  {
    // The cohort has no mentors yet: Marisol makes Daniel lead and Hana supporting.
    name: 'cohort-mentors-desktop',
    run: async (demo) => {
      const state = newState({ term: '2026–27' });
      await fakeApi(demo, state);
      await demo.go('/programs/p-tutoring', { ready: false });
      await demo.app().getByRole('heading', { name: 'No mentors yet' }).waitFor();
      demo.mark();
      await demo.pause(1400);
      await shot(demo, 'desktop-no-mentors');
      await demo.click(demo.app().getByRole('button', { name: 'Assign mentors' }));
      await dialog(demo).waitFor();
      await demo.pause(800);
      await demo.click(dialog(demo).getByRole('button', { name: 'Save mentors' }));
      await dialog(demo).getByText('Choose a lead mentor.').waitFor();
      await demo.pause(1200);
      await shot(demo, 'desktop-cohort-mentors-invalid');
      await dialog(demo).getByLabel('Lead mentor', { exact: true }).selectOption({ label: 'Daniel Osei' });
      await demo.pause(700);
      await demo.click(dialog(demo).getByRole('group', { name: 'Supporting mentors' }).getByLabel('Hana Kim'));
      await demo.pause(900);
      await demo.click(dialog(demo).getByRole('button', { name: 'Save mentors' }));
      await demo.app().getByRole('list', { name: 'Mentors' }).getByText('Lead mentor').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-mentors');
      await demo.pause(800);
    },
  },
  {
    // On a phone: Mentor on Mateo's row, a save without a choice, a failed save, then Daniel assigned.
    name: 'assign-mentor-phone',
    phone: true,
    run: async (demo) => {
      const state = newState({ term: '2026–27', lead: 'm-daniel', supporting: ['m-hana'] });
      await fakeApi(demo, state);
      await demo.go('/programs/p-tutoring', { ready: false });
      await heading(demo, 1, 'After-School Tutoring');
      await demo.app().getByRole('button', { name: 'Assign a mentor to Mateo Rivera' }).waitFor();
      demo.mark();
      await demo.pause(1000);
      await shot(demo, 'phone-program');
      await demo.click(demo.app().getByRole('button', { name: 'Assign a mentor to Mateo Rivera' }));
      await dialog(demo).waitFor();
      await demo.pause(800);
      await demo.click(dialog(demo).getByRole('button', { name: 'Assign mentor' }));
      await dialog(demo).getByText('Choose a mentor.').waitFor();
      await demo.pause(1200);
      await shot(demo, 'phone-assign-invalid');
      await dialog(demo).getByLabel('Mentor', { exact: true }).selectOption({ label: 'Daniel Osei' });
      await demo.pause(700);
      state.failNext = '/youth/c-mateo/mentor';
      await demo.click(dialog(demo).getByRole('button', { name: 'Assign mentor' }));
      await dialog(demo).getByText('That didn’t go through').waitFor();
      await demo.pause(1400);
      await shot(demo, 'phone-assign-failed');
      await demo.click(dialog(demo).getByRole('button', { name: 'Assign mentor' }));
      await demo.app().getByText('Mentor: Daniel Osei').first().waitFor();
      await demo.pause(600);
      await shot(demo, 'phone-mentor-assigned');
      await demo.pause(1800);
    },
  },
  {
    // Daniel opens Mentoring: the youth of the cohort he leads, by name.
    name: 'mentor-youth-phone',
    phone: true,
    run: async (demo) => {
      const state = newState({ lead: 'm-daniel', supporting: ['m-hana'], assigned: { 'c-mateo': 'm-daniel' } });
      await fakeApi(demo, state, () => daniel);
      await demo.go('/mentoring', { ready: false });
      await demo.app().getByRole('list', { name: 'Youth you mentor' }).waitFor();
      demo.mark();
      await demo.pause(1600);
      await shot(demo, 'phone-mentoring-assigned');
      await demo.pause(1800);
    },
  },
  {
    // Mentoring off: no Mentors card and no Mentor buttons; and the error state when the program cannot load.
    name: 'mentoring-off-desktop',
    run: async (demo) => {
      const state = newState({ term: '2026–27', mentoring: false });
      await fakeApi(demo, state);
      await demo.go('/programs/p-tutoring', { ready: false });
      await heading(demo, 1, 'After-School Tutoring');
      await demo.app().getByText('Jordan Thompson').waitFor();
      demo.mark();
      await demo.pause(1600);
      await shot(demo, 'desktop-mentoring-off');
      state.programFails = true;
      await demo.go('/programs/p-tutoring', { ready: false });
      await demo.app().getByRole('heading', { name: 'We couldn’t load this program' }).waitFor();
      await demo.pause(1400);
      await shot(demo, 'desktop-program-error');
      await demo.pause(600);
    },
  },
];
