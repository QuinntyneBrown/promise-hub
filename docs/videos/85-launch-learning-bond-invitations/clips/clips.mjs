// Screen recordings and screenshots for video 85, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: Tom Nguyen (Admin) at Harbourview plans the Learning Bond launch (the counts, the households to collect
// from, a day out of range, Mon 9 Nov, Cancel the launch?), then chooses Staff invite at the door and invites the Thompson household from
// its page; Linh Tran asks for a call and Tom marks it done; then a phone, the no-mobile block and a site lead outside the status roles
// (L2-140, L2-142, ADR 0079). No SIN, income or amount appears anywhere.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const SUITE = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring', 'LearningBond'];
const PEOPLE = {
  'm-tom': { personName: 'Tom Nguyen', role: 'Admin' },
  'm-jaylen': { personName: 'Jaylen Okafor', role: 'SiteLead' },
};
const TUTORING = { id: 'p-tutoring', name: 'After-School Tutoring' };
const SPORTS = { id: 'p-sports', name: 'Saturday Sports' };
// The covered households (LearningBondCoverage over the seed): guardians, children, programs and language.
const HOUSEHOLDS = [
  { id: 'hh-haddad', name: 'Haddad', language: 'French', programs: [TUTORING], children: [['c-yusuf', 'Yusuf Haddad', 13]], guardians: [['g-nour', 'Nour Haddad', '905-555-0128', 'nour.haddad@example.com']] },
  {
    id: 'hh-rivera',
    name: 'Rivera',
    language: 'Spanish',
    programs: [TUTORING],
    children: [['c-mateo', 'Mateo Rivera', 9], ['c-sofia', 'Sofía Rivera', 12]],
    guardians: [['g-carmen', 'Carmen Rivera', '905-555-0142', 'carmen.rivera@example.com'], ['g-luis', 'Luis Rivera', '905-555-0199', null]],
  },
  { id: 'hh-thompson', name: 'Thompson', language: 'English', programs: [TUTORING], children: [['c-jordan', 'Jordan Thompson', 11]], guardians: [['g-dana', 'Dana Thompson', '905-555-0117', 'dana.thompson@example.com']] },
  { id: 'hh-tran', name: 'Tran', language: 'English', programs: [SPORTS], children: [['c-kevin', 'Kevin Tran', 8], ['c-emily', 'Emily Tran', 10]], guardians: [['g-linh', 'Linh Tran', '905-555-0163', null]] },
];
const NOW = '2026-11-05T21:12:00Z';
const LINK = 'promisehub.ca/lb/4r7k9x';
const DAYS = { '2026-11-09': 'Mon 9 Nov 2026' };

const newState = (who, x = {}) => ({
  who,
  statusRoles: ['Admin', 'ProgramDirector'],
  launch: null,
  invitations: [],
  calls: [],
  noMobiles: false,
  noContact: [],
  fail: null,
  ...x,
});

const first = (h) => h.children.map((c) => c[1].split(' ')[0]).sort();
const names = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`);
const reach = (state, h) =>
  state.noContact.includes(h.id) ? 'Neither' : !state.noMobiles && h.guardians.some((g) => g[2]) ? 'Mobile' : h.guardians.some((g) => g[3]) ? 'EmailOnly' : 'Neither';

/** The Learning Bond and household endpoints as the real API answers them (LearningBondLaunchHandler, LearningBondHouseholdHandler, LearningBondFamiliesHandler). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());
    const path = url.pathname;
    if (state.fail && path === state.fail) return route.fulfill({ status: 500 });
    if (!state.who) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    const p = PEOPLE[state.who];
    const sees = state.statusRoles.includes(p.role);
    const admin = p.role === 'Admin';
    if (path === '/api/me')
      return route.fulfill({
        json: { personName: p.personName, role: p.role, organizationId: 'org-harbourview', organizationName: ORG, plan: 'Standard', modules: SUITE, membershipId: state.who, learningBondStatus: sees, display: { theme: 'system', textSize: 'default', reduceMotion: false } },
      });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 6, households: 4, slipsDue: [], comingUp: [], tasks: [] } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    const household = path.match(/^\/api\/households\/([^/]+)$/);
    if (household) {
      const h = HOUSEHOLDS.find((x) => x.id === household[1]);
      return route.fulfill({
        json: {
          id: h.id,
          name: h.name,
          language: h.language,
          medicalRestricted: false,
          children: h.children.map(([id, name, age]) => ({ id, name, age, school: null, medicalFlag: null })),
          guardians: h.guardians.map(([id, name, mobile, email], i) => ({ id, name, relationship: 'Mother', mobile, email, language: h.language, isPrimary: i === 0, canPickUp: true, canSign: true })),
        },
      });
    }
    if (path === '/api/learning-bond/overview')
      return route.fulfill({
        json: { agreementVersion: 2, acceptance: { version: 2, acceptedBy: 'Tom Nguyen', acceptedAt: '2026-10-29T15:00:00Z' }, pendingVersion: null, pendingEffectiveOn: null, coverage: 'AllPrograms', programs: [], households: 4, statusRoles: state.statusRoles, senderName: ORG, languages: ['en', 'es', 'fr'], launchBlocked: null },
      });
    if (path.startsWith('/api/learning-bond/launch')) {
      if (!admin) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      const counts = (r) => HOUSEHOLDS.filter((h) => reach(state, h) === r).length;
      if (path.endsWith('/missing-contacts'))
        return route.fulfill({ json: { households: HOUSEHOLDS.filter((h) => reach(state, h) === 'Neither').map((h) => ({ householdId: h.id, name: h.name, guardian: h.guardians[0][1], programs: h.programs.map((x) => x.name).join(', ') })) } });
      if (method === 'GET')
        return route.fulfill({
          json: { covered: 4, mobile: counts('Mobile'), emailOnly: counts('EmailOnly'), neither: counts('Neither'), programs: [TUTORING.name, SPORTS.name], noPhoneNumbers: counts('Mobile') === 0, mode: state.launch?.mode ?? null, date: state.launch?.date ?? null, launchedAt: null, earliest: '2026-11-06', latest: '2027-02-03', launchBlocked: null },
        });
      if (method === 'DELETE') {
        state.launch = null;
        return route.fulfill({ status: 204 });
      }
      const b = req.postDataJSON();
      const date = method === 'PUT' ? b.date : b.date;
      if ((method === 'PUT' || b.mode === 'Scheduled') && !(date >= '2026-11-06' && date <= '2027-02-03'))
        return route.fulfill({ status: 422, json: { errors: { date: 'Choose a date from tomorrow to 90 days ahead.' } } });
      state.launch = method === 'PUT' ? { ...state.launch, date } : { mode: b.mode, date: b.mode === 'Scheduled' ? date : null };
      return route.fulfill({ status: method === 'PUT' ? 204 : 201, json: { id: 'launch' } });
    }
    if (path === '/api/learning-bond/households') {
      if (!sees) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      const status = url.searchParams.get('status');
      const rows = HOUSEHOLDS.map((h) => {
        const open = state.calls.find((c) => c.id === h.id && !c.outcome);
        const notInterested = state.calls.find((c) => c.id === h.id && c.outcome === 'NotInterested');
        const invited = state.invitations.find((i) => i.id === h.id)?.at ?? null;
        return {
          householdId: h.id,
          name: h.name,
          guardian: h.guardians[0][1],
          programs: h.programs.map((x) => x.name).join(', '),
          status: open ? 'CallRequested' : notInterested ? 'NotInterested' : invited ? 'Invited' : 'NotInvited',
          changedAt: open?.at ?? invited,
          callPhone: open?.phone ?? null,
          callWhen: open?.when ?? null,
        };
      });
      return route.fulfill({
        json: { covered: 4, programs: [{ ...TUTORING, households: 3 }, { ...SPORTS, households: 1 }], households: rows.filter((r) => !status || r.status === status) },
      });
    }
    const card = path.match(/^\/api\/learning-bond\/households\/([^/]+)(\/invitations|\/call-outcome)?$/);
    if (card) {
      if (!sees) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      const h = HOUSEHOLDS.find((x) => x.id === card[1]);
      if (card[2] === '/invitations') {
        state.invitations.push({ id: h.id, at: NOW });
        return route.fulfill({ status: 201, json: { invitedAt: NOW } });
      }
      if (card[2] === '/call-outcome') {
        const { outcome } = req.postDataJSON();
        for (const c of state.calls.filter((x) => x.id === h.id && !x.outcome)) if (outcome !== 'NoAnswer') c.outcome = outcome;
        return route.fulfill({ status: 204 });
      }
      const sms = `${ORG}: ${names(first(h))} may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: ${LINK} (STOP to opt out)`;
      return route.fulfill({
        json: { householdId: h.id, name: h.name, covered: true, programs: h.programs.map((x) => x.name), children: first(h), invitedAt: state.invitations.find((i) => i.id === h.id)?.at ?? null, recipients: h.guardians.map((g) => g[1]), language: h.language, sms, smsCharacters: sms.length, smsSegments: sms.length <= 160 ? 1 : 2 },
      });
    }
    if (path === '/api/learning-bond') return route.fulfill({ json: { on: true } });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const link = (demo, name) => app(demo).getByRole('link', { name, exact: true });

export default [
  {
    // Tom plans the launch: the counts, the households to collect from, a day out of range, Mon 9 Nov, and Cancel the launch?.
    name: 'launch-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom', { noContact: ['hh-thompson'] }));
      await demo.go('/settings/learning-bond', { ready: false });
      await heading(demo, 'Learning Bond');
      demo.mark();
      await app(demo).getByTestId('hub-launch').scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await shot(demo, 'desktop-hub');
      await demo.click(link(demo, 'Plan the launch'));
      await heading(demo, 'Launch');
      await demo.pause(2600);
      await shot(demo, 'desktop-launch');
      await demo.click(link(demo, 'View households to collect from'));
      await heading(demo, 'Households to collect from');
      await demo.pause(2400);
      await shot(demo, 'desktop-missing-contacts');
      await demo.click(link(demo, 'Back to launch'));
      await heading(demo, 'Launch');
      const day = app(demo).getByLabel('Day', { exact: true });
      await day.fill('2026-11-05');
      await demo.click(button(demo, 'Schedule launch'));
      await app(demo).getByTestId('launch-day-error').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-launch-invalid');
      await day.fill('2026-11-09');
      await demo.click(button(demo, 'Schedule launch'));
      await app(demo).getByTestId('launch-status').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-launch-scheduled');
      await demo.click(button(demo, 'Cancel launch'));
      await app(demo).getByRole('dialog', { name: 'Cancel the launch?' }).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-cancel-launch');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Cancel launch' }));
      await app(demo).getByText('Launch cancelled').first().waitFor();
      await demo.pause(2000);
    },
  },
  {
    // At the door: Tom chooses it, then invites the Thompson household from its page.
    name: 'door-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings/learning-bond/launch', { ready: false });
      await heading(demo, 'Launch');
      demo.mark();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('radio', { name: 'Staff invite at the door' }));
      await demo.click(button(demo, 'Launch without a mass send'));
      await app(demo).getByTestId('launch-status').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-launch-at-door');
      await demo.go('/families/hh-thompson', { ready: false });
      await app(demo).getByTestId('learning-bond-card').waitFor();
      await app(demo).getByTestId('learning-bond-card').scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'desktop-household-card');
      await demo.click(button(demo, 'Invite to Learning Bond'));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-invite-dialog');
      await demo.click(button(demo, 'Send invitation'));
      await app(demo).getByText('Thompson household invited').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-household-invited');
    },
  },
  {
    // The covered households: Linh Tran asked for a call; Tom marks it done as not interested.
    name: 'families-desktop',
    run: async (demo) => {
      const state = newState('m-tom', { invitations: [{ id: 'hh-thompson', at: '2026-11-05T15:00:00Z' }], calls: [{ id: 'hh-tran', phone: '289-555-0119', when: 'Afternoons', at: '2026-11-05T19:10:00Z', outcome: null }] });
      await fakeApi(demo, state);
      await demo.go('/learning-bond/families', { ready: false });
      await heading(demo, 'Learning Bond households');
      demo.mark();
      await demo.pause(3000);
      await shot(demo, 'desktop-families');
      await demo.click(button(demo, 'Mark call done'));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(2200);
      await demo.click(app(demo).getByRole('radio', { name: 'Not interested' }));
      await demo.pause(800);
      await shot(demo, 'desktop-call-outcome');
      await demo.click(button(demo, 'Save outcome'));
      await app(demo).getByText('Call recorded').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-families-done');
    },
  },
  {
    // The households and the launch on Tom's phone.
    name: 'families-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom', { calls: [{ id: 'hh-tran', phone: '289-555-0119', when: 'Afternoons', at: '2026-11-05T19:10:00Z', outcome: null }] }));
      await demo.go('/learning-bond/families', { ready: false });
      await heading(demo, 'Learning Bond households');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'phone-families');
      await demo.go('/settings/learning-bond/launch', { ready: false });
      await heading(demo, 'Launch');
      await demo.pause(2600);
      await shot(demo, 'phone-launch');
    },
  },
  {
    // No mobile number on any covered household, and a site lead outside the status roles.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-tom', { noMobiles: true });
      await fakeApi(demo, state);
      await demo.go('/settings/learning-bond/launch', { ready: false });
      await heading(demo, 'Launch');
      demo.mark();
      await app(demo).getByTestId('launch-blocked').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-launch-blocked');
      state.who = 'm-jaylen';
      await demo.go('/learning-bond/families', { ready: false });
      await app(demo).getByRole('heading', { name: 'Your role doesn’t see Learning Bond status' }).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-families-forbidden');
    },
  },
];
