// Screen recordings and screenshots for video 59, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Tom Nguyen (Admin) at Harbourview reviews Zoe Campbell's
// referral from Rachel Ellis, Malik Johnson's own application and Linh Tran's enrollment of Kevin (L2-072).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const org = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };
const MODULES = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const NOW = '2026-11-05T21:12:00Z';

const programs = () => [
  { id: 'p-tutoring', name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24', enrolled: 48, capacity: 50, enrollmentOpen: true, status: 'Active', term: '2026–27' },
  { id: 'p-sports', name: 'Saturday Sports', schedule: 'Sat, 10 am–12 pm', startsOn: '2026-09-12', endsOn: '2027-05-29', enrolled: 62, capacity: 80, enrollmentOpen: true, status: 'Active', term: '2026–27' },
  { id: 'p-winter', name: 'Winter Camp 2026', schedule: '21–23 Dec, 8 am–5 pm', startsOn: '2026-12-21', endsOn: '2026-12-23', enrolled: 60, capacity: 60, enrollmentOpen: true, status: 'Active', term: 'Winter 2026' },
];

const applicant = (o) => ({
  status: 'WaitingReview', position: null, returning: false, reviewedBy: null, reviewedAt: null, note: null, referrerRole: null, referrer: null, notes: [],
  programId: 'p-tutoring', program: 'After-School Tutoring', language: 'English', ...o,
});

const newState = () => ({
  who: { personName: 'Tom Nguyen', role: 'Admin' },
  fail: false,
  invitations: [],
  apps: [
    applicant({ id: 'er-zoe', childId: 'c-zoe', child: 'Zoe Campbell', firstName: 'Zoe', age: 13, dateOfBirth: '2013-03-14', appliedAs: 'Referrer', appliedBy: 'Rachel Ellis', referrerRole: 'Guidance counsellor',
      submittedAt: '2026-11-05T18:02:00Z', seasonConsent: false, householdId: 'hh-campbell', household: 'Campbell', guardian: { name: 'Tanya Campbell', mobile: '905-555-0320', email: null, language: 'English' },
      reason: 'Zoe is curious and kind, and needs somewhere to belong after school.', referrer: { name: 'Rachel Ellis', role: 'Guidance counsellor', organization: 'Bennetto Elementary', contact: 'rachel.ellis@bennetto.example.ca' },
      notes: [{ id: 'n1', author: 'Marisol Delgado', text: 'Rachel says Zoe would do well with a mentor. Tutoring has two places.', createdAt: '2026-11-05T19:15:00Z' }] }),
    applicant({ id: 'er-malik', childId: 'c-malik', child: 'Malik Johnson', firstName: 'Malik', age: 14, dateOfBirth: '2012-06-02', appliedAs: 'Youth', appliedBy: 'Malik Johnson',
      submittedAt: '2026-11-04T23:48:00Z', seasonConsent: false, householdId: 'hh-johnson', household: 'Johnson', guardian: { name: 'Denise Johnson', mobile: '905-555-0310', email: null, language: 'English' },
      reason: 'I want to learn to code and help with the younger kids.' }),
    applicant({ id: 'er-kevin', childId: 'c-kevin', child: 'Kevin Tran', firstName: 'Kevin', age: 8, dateOfBirth: '2018-02-11', appliedAs: 'Guardian', appliedBy: 'Linh Tran', returning: true,
      submittedAt: '2026-11-02T15:00:00Z', seasonConsent: true, householdId: 'hh-tran', household: 'Tran', guardian: { name: 'Linh Tran', mobile: '289-555-0119', email: 'linh.tran@example.com', language: 'English' }, reason: null }),
    applicant({ id: 'er-sofia', childId: 'c-sofia', child: 'Sofía Rivera', firstName: 'Sofía', age: 12, dateOfBirth: '2014-05-09', appliedAs: 'Guardian', appliedBy: 'Carmen Rivera', returning: true, status: 'Waitlisted', position: 1,
      submittedAt: '2026-11-02T14:00:00Z', seasonConsent: true, householdId: 'hh-rivera', household: 'Rivera', guardian: { name: 'Carmen Rivera', mobile: '905-555-0142', email: null, language: 'Spanish' }, reason: null }),
    applicant({ id: 'er-omar', childId: 'c-omar', child: 'Omar Siddiqui', firstName: 'Omar', age: 12, dateOfBirth: '2014-01-20', appliedAs: 'Guardian', appliedBy: 'Farah Siddiqui', status: 'Accepted', program: 'Saturday Sports', programId: 'p-sports',
      submittedAt: '2026-11-01T14:00:00Z', reviewedBy: 'Tom Nguyen', reviewedAt: '2026-11-03T15:00:00Z', seasonConsent: true, householdId: 'hh-siddiqui', household: 'Siddiqui', guardian: { name: 'Farah Siddiqui', mobile: '905-555-0177', email: null, language: 'English' }, reason: null }),
  ],
});

const summary = ({ notes, guardian, referrer, reason, household, householdId, firstName, dateOfBirth, language, ...s }) => s;

async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = () => request.postDataJSON() ?? {};
    const staff = ['Admin', 'ProgramDirector'].includes(state.who.role);
    if (path === '/api/me') return route.fulfill({ json: { ...state.who, ...org, modules: MODULES } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/programs') return route.fulfill({ json: { programs: programs(), active: 3, archived: 1, enrolled: 170 } });
    if (path.startsWith('/api/applications') && !staff) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
    if (path === '/api/applications') {
      if (state.fail) {
        state.fail = false;
        return route.fulfill({ status: 500, json: { code: 'server-error' } });
      }
      const status = new URL(request.url()).searchParams.get('status') ?? 'WaitingReview';
      const count = (s) => state.apps.filter((a) => a.status === s).length;
      const rows = state.apps.filter((a) => a.status === status).sort((a, z) => z.submittedAt.localeCompare(a.submittedAt)).map(summary);
      return route.fulfill({ json: { counts: { waitingReview: count('WaitingReview'), waitlisted: count('Waitlisted'), accepted: count('Accepted'), declined: count('Declined') }, applications: rows } });
    }
    const one = /^\/api\/applications\/([^/]+)(\/notes|\/place)?$/.exec(path);
    if (one) {
      const a = state.apps.find((x) => x.id === one[1]);
      if (!a) return route.fulfill({ status: 404 });
      if (!one[2]) return route.fulfill({ json: { ...a, notes: [...a.notes].sort((x, z) => z.createdAt.localeCompare(x.createdAt)) } });
      if (one[2] === '/notes') {
        const text = (body().text ?? '').trim();
        if (!text) return route.fulfill({ status: 422, json: { errors: { text: 'Write a note of up to 2,000 characters.' } } });
        a.notes.push({ id: `n${a.notes.length + 2}`, author: state.who.personName, text, createdAt: NOW });
        return route.fulfill({ status: 201, json: { id: 'n' } });
      }
      const p = programs().find((x) => x.id === body().programId);
      if (!p) return route.fulfill({ status: 422, json: { errors: { programId: 'Choose a cohort.' } } });
      Object.assign(a, { status: 'Accepted', programId: p.id, program: p.name, position: null, reviewedBy: state.who.personName, reviewedAt: NOW, note: body().note ?? null });
      return route.fulfill({ status: 204 });
    }
    const review = /^\/api\/enrollments\/([^/]+)\/review$/.exec(path);
    if (review) {
      const a = state.apps.find((x) => x.id === review[1]);
      const { decision, note } = body();
      if (decision === 'Decline' && !note?.trim()) return route.fulfill({ status: 422, json: { errors: { note: 'Write a reason the guardian will read.' } } });
      Object.assign(a, decision === 'Waitlist'
        ? { status: 'Waitlisted', position: state.apps.filter((x) => x.status === 'Waitlisted').length + 1, note: note ?? null }
        : { status: 'Declined', position: null, note }, { reviewedBy: state.who.personName, reviewedAt: NOW });
      return route.fulfill({ status: 204 });
    }
    const invite = /^\/api\/children\/([^/]+)\/youth-invitation$/.exec(path);
    if (invite) {
      const email = (body().email ?? '').trim().toLowerCase();
      if (email.endsWith('@harbourview.example')) return route.fulfill({ status: 422, json: { errors: { email: 'Jaylen Okafor already has access.' } } });
      state.invitations.push({ childId: invite[1], email });
      return route.fulfill({ status: 201, json: { id: 'inv-1' } });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const dialog = (demo) => app(demo).getByRole('dialog');

export default [
  {
    // The pipeline, its status tabs, Zoe's referral and a note.
    name: 'pipeline-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/applications', { ready: false });
      await heading(demo, 'Applications');
      await app(demo).getByText('Zoe Campbell').first().waitFor();
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-applications');
      await demo.click(app(demo).getByRole('tab', { name: /^Waitlisted/ }));
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('tab', { name: /^Accepted/ }));
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('tab', { name: /^Waiting review/ }));
      await demo.pause(1000);
      await demo.click(app(demo).getByRole('link', { name: /Zoe Campbell/ }));
      await heading(demo, 'Zoe Campbell');
      await demo.pause(2600);
      await shot(demo, 'desktop-application');
      await demo.click(button(demo, 'Add note'));
      await dialog(demo).waitFor();
      await demo.type(app(demo).getByRole('textbox', { name: 'Note', exact: true }), 'Called Tanya: she knows about the referral and is happy for Zoe to start.');
      await demo.pause(800);
      await shot(demo, 'desktop-note-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: 'Add note' }));
      await dialog(demo).waitFor({ state: 'hidden' });
      await demo.pause(2400);
      await shot(demo, 'desktop-noted');
    },
  },
  {
    // Tom places Zoe in After-School Tutoring and invites her as a youth.
    name: 'place-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/applications/er-zoe', { ready: false });
      await heading(demo, 'Zoe Campbell');
      demo.mark();
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('button', { name: 'Place Zoe' }));
      await dialog(demo).waitFor();
      await demo.pause(1600);
      await demo.type(app(demo).getByRole('textbox', { name: 'Zoe’s email' }), 'zoe.campbell@example.ca');
      await demo.type(app(demo).getByLabel(/^Note to the family/), 'Welcome! Tutoring is Monday to Thursday, 4 to 6 pm.');
      await demo.pause(800);
      await shot(demo, 'desktop-place-dialog');
      await demo.click(dialog(demo).getByRole('button', { name: /^Place and text/ }));
      await dialog(demo).waitFor({ state: 'hidden' });
      await app(demo).getByTestId('application-outcome').waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-placed');
    },
  },
  {
    // Malik waitlisted; Kevin declined, first without a reason.
    name: 'decide-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/applications/er-malik', { ready: false });
      await heading(demo, 'Malik Johnson');
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'desktop-youth-application');
      await demo.click(app(demo).getByRole('button', { name: 'Waitlist Malik' }));
      await dialog(demo).waitFor();
      await demo.pause(1200);
      await demo.click(dialog(demo).getByRole('button', { name: /^Waitlist and text/ }));
      await dialog(demo).waitFor({ state: 'hidden' });
      await demo.pause(2200);
      await shot(demo, 'desktop-waitlisted');
      await demo.go('/applications/er-kevin', { ready: false });
      await heading(demo, 'Kevin Tran');
      await demo.pause(1000);
      await demo.click(app(demo).getByRole('button', { name: 'Decline Kevin' }));
      await dialog(demo).waitFor();
      await demo.click(dialog(demo).getByRole('button', { name: /^Decline and text/ }));
      await app(demo).getByText('Write a reason the guardian will read.').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-decline-reason');
      await demo.type(dialog(demo).getByRole('textbox'), 'Tutoring is full this term; we’ll call you in January.');
      await demo.click(dialog(demo).getByRole('button', { name: /^Decline and text/ }));
      await dialog(demo).waitFor({ state: 'hidden' });
      await demo.pause(2600);
      await shot(demo, 'desktop-declined');
    },
  },
  {
    // On a phone: the pipeline and Zoe's referral.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/applications', { ready: false });
      await heading(demo, 'Applications');
      await app(demo).getByText('Zoe Campbell').first().waitFor();
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'phone-applications');
      await demo.click(app(demo).getByRole('link', { name: /Zoe Campbell/ }));
      await heading(demo, 'Zoe Campbell');
      await demo.pause(1600);
      await shot(demo, 'phone-application');
      await app(demo).getByRole('region', { name: 'Referral' }).scrollIntoViewIfNeeded();
      await demo.pause(1800);
      await app(demo).getByRole('region', { name: 'Notes' }).scrollIntoViewIfNeeded();
      await demo.pause(1800);
    },
  },
  {
    // Nothing waiting, a failed load, another organization's link and a site lead.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      state.apps = state.apps.filter((a) => a.status !== 'WaitingReview');
      await fakeApi(demo, state);
      await demo.go('/applications', { ready: false });
      await heading(demo, 'Applications');
      await app(demo).getByText('You’re all caught up').waitFor();
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-empty');
      state.fail = true;
      await demo.go('/applications', { ready: false });
      await app(demo).getByText('Couldn’t load applications').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-error');
      await demo.go('/applications/er-northgate', { ready: false });
      await heading(demo, 'We can’t find that application');
      await demo.pause(2000);
      await shot(demo, 'desktop-not-found');
      state.who = { personName: 'Jaylen Okafor', role: 'SiteLead' };
      await demo.go('/applications', { ready: false });
      await heading(demo, 'Only admins and program directors review applications');
      await demo.pause(2200);
      await shot(demo, 'desktop-forbidden');
    },
  },
];
