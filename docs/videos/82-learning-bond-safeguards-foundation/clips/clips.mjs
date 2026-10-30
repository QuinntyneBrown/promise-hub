// Screen recordings and screenshots for video 82, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Grace Mensah (Admin) at Northgate turns Learning Bond on and is
// refused twice, for Messages and for the data-handling agreement; Tom Nguyen (Admin) at Harbourview, whose agreement is
// accepted, turns it on; Grace opens /learning-bond while it is off and lands on Today; Carmen Rivera opens a Learning
// Bond link from an organization with the module off, and an unknown link, on her phone; then the loading error and
// Jaylen's forbidden page (L2-135, L2-161, L2-162, ADR 0076). No social insurance number appears anywhere.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const CATALOG = [
  ['Roster', 'Roster', []],
  ['Slips', 'Permission slips', ['Roster']],
  ['RollCall', 'Roll Call', ['Roster']],
  ['QuickCards', 'Quick Cards', ['Roster']],
  ['Pickup', 'Pickup', ['Roster', 'RollCall']],
  ['Messages', 'Messages', ['Roster']],
  ['Incidents', 'Incident log', ['Roster']],
  ['Reports', 'Reports', ['Roster']],
  ['Learning', 'Learning', ['Roster']],
  ['Mentoring', 'Mentoring', ['Roster']],
  ['PublicWebsite', 'Public website', ['Roster']],
  ['LearningBond', 'Learning Bond', ['Roster', 'Messages']],
];
const SUITE = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const PEOPLE = {
  'm-tom': { personName: 'Tom Nguyen', role: 'Admin', org: 'harbourview' },
  'm-jaylen': { personName: 'Jaylen Okafor', role: 'SiteLead', org: 'harbourview' },
  'm-grace': { personName: 'Grace Mensah', role: 'Admin', org: 'northgate' },
};
const ORGS = {
  harbourview: { id: 'org-harbourview', name: 'Harbourview Youth Collective', plan: 'Standard' },
  northgate: { id: 'org-northgate', name: 'Northgate Community Church Kids', plan: 'Free' },
};
// Only Harbourview has accepted the current data-handling agreement (DatabaseSeeder, version 2).
const ACCEPTED = ['org-harbourview'];
const LINKS = { 'tok-lb-rivera': 'org-harbourview', 'tok-lb-northgate': 'org-northgate' };

const newState = (who, x = {}) => ({
  who,
  modules: { 'org-harbourview': [...SUITE], 'org-northgate': ['Roster', 'RollCall', 'QuickCards'] },
  fail: null,
  ...x,
});

/** The module endpoints as the real API answers them (GetModulesHandler, SaveModulesHandler with ModuleRules and LearningBondAgreementGate, the Learning Bond doors). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (state.fail && path === state.fail) return route.fulfill({ status: 500 });
    const guardian = /^\/api\/g\/learning-bond\/([^/]+)$/.exec(path);
    if (guardian) {
      const org = LINKS[guardian[1]];
      if (!org || !state.modules[org].includes('LearningBond')) return route.fulfill({ status: 404 });
      return route.fulfill({ json: { organization: Object.values(ORGS).find((o) => o.id === org).name, language: 'es' } });
    }
    if (!state.who) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    const p = PEOPLE[state.who];
    const org = ORGS[p.org];
    const on = state.modules[org.id];
    if (path === '/api/me')
      return route.fulfill({
        json: { personName: p.personName, role: p.role, organizationId: org.id, organizationName: org.name, plan: org.plan, modules: on, membershipId: state.who, display: { theme: 'system', textSize: 'default', reduceMotion: false } },
      });
    if (path === '/api/learning-bond') return on.includes('LearningBond') ? route.fulfill({ json: { on: true } }) : route.fulfill({ status: 404 });
    if (path === '/api/settings/modules') {
      if (p.role !== 'Admin') return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      if (req.method() === 'GET')
        return route.fulfill({ json: { modules: CATALOG.map(([id, name, needs]) => ({ id, name, on: on.includes(id), needs })) } });
      const next = req.postDataJSON().on;
      const name = (id) => CATALOG.find((c) => c[0] === id)[1];
      const errors = [];
      if (!next.includes('Roster')) {
        const names = CATALOG.filter(([id, , needs]) => next.includes(id) && needs.includes('Roster')).map(([, n]) => n);
        if (names.length) errors.push({ module: 'Roster', message: `${names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`} ${names.length === 1 ? 'needs' : 'need'} the roster.` });
      }
      for (const [id, n, needs] of CATALOG.filter(([id]) => next.includes(id))) {
        const missing = needs.filter((x) => x !== 'Roster' && !next.includes(x));
        if (missing.length) errors.push({ module: id, message: `${n} needs ${missing.map(name).join(' and ')}.` });
      }
      if (!errors.length && next.includes('LearningBond') && !on.includes('LearningBond') && !ACCEPTED.includes(org.id))
        errors.push({ module: 'LearningBond', message: 'Accept the Learning Bond data-handling agreement first.' });
      if (errors.length) return route.fulfill({ status: 422, json: { errors } });
      state.modules[org.id] = CATALOG.map(([id]) => id).filter((id) => next.includes(id));
      return route.fulfill({ json: { on: next.length } });
    }
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 1, households: 1, slipsDue: [], comingUp: [], tasks: [] } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const row = (demo, name) =>
  app(demo).getByRole('list', { name: 'Modules' }).getByRole('listitem').filter({ has: app(demo).getByTestId('list-title').getByText(name, { exact: true }) });
const toggle = (demo, name) => app(demo).getByRole('switch', { name: `${name} on` });
const save = (demo) => app(demo).getByRole('button', { name: 'Save changes' });

export default [
  {
    // Grace at Northgate: Learning Bond off and needing Roster and Messages; refused for Messages, then for the agreement.
    name: 'refused-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-grace'));
      await demo.go('/settings/modules', { ready: false });
      await heading(demo, 'Modules');
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-northgate-off');
      await demo.click(toggle(demo, 'Learning Bond'));
      await demo.click(save(demo));
      await row(demo, 'Learning Bond').getByText('Learning Bond needs Messages.').waitFor();
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'desktop-needs-messages');
      await demo.click(toggle(demo, 'Messages'));
      await demo.click(save(demo));
      await row(demo, 'Learning Bond').getByText('Accept the Learning Bond data-handling agreement first.').waitFor();
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      await demo.pause(3000);
      await shot(demo, 'desktop-agreement');
    },
  },
  {
    // Tom at Harbourview, whose agreement is accepted: Learning Bond on and saved.
    name: 'turn-on-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings/modules', { ready: false });
      await heading(demo, 'Modules');
      demo.mark();
      await demo.pause(2000);
      await shot(demo, 'desktop-harbourview');
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      await demo.pause(1200);
      await demo.click(toggle(demo, 'Learning Bond'));
      await demo.pause(800);
      await demo.click(save(demo));
      await app(demo).getByText('Modules saved').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-saved');
    },
  },
  {
    // Grace opens /learning-bond while it is off for Northgate: Today opens and the library never loads.
    name: 'redirect-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-grace'));
      await demo.go('/learning-bond', { ready: false });
      await heading(demo, 'Welcome, Grace');
      demo.mark();
      await demo.pause(3000);
      await shot(demo, 'desktop-redirect');
    },
  },
  {
    // Carmen opens a Learning Bond link from an organization with the module off, then an unknown link: the same page.
    name: 'guardian-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState(null));
      await demo.go('/g/learning-bond/tok-lb-northgate', { ready: false });
      await heading(demo, 'Learning Bond isn’t available');
      demo.mark();
      await demo.pause(3200);
      await shot(demo, 'phone-unavailable');
      await demo.go('/g/learning-bond/tok-lb-unknown', { ready: false });
      await heading(demo, 'Learning Bond isn’t available');
      await demo.pause(2400);
    },
  },
  {
    // Settings › Modules on a phone, a failed load with Try again, and a site lead's forbidden page.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-tom', { fail: '/api/settings/modules' });
      await fakeApi(demo, state);
      await demo.go('/settings/modules', { ready: false });
      await app(demo).getByRole('heading', { name: 'We couldn’t load modules' }).waitFor();
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-error');
      state.fail = null;
      await demo.click(app(demo).getByRole('button', { name: 'Try again' }));
      await toggle(demo, 'Learning Bond').waitFor();
      await demo.pause(1600);
      state.who = 'm-jaylen';
      await demo.go('/settings/modules', { ready: false });
      await app(demo).getByRole('heading', { name: 'Admins configure modules' }).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-forbidden');
    },
  },
  {
    // The same list on Tom's phone: each module with what it needs.
    name: 'modules-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings/modules', { ready: false });
      await heading(demo, 'Modules');
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'phone-modules');
    },
  },
];
