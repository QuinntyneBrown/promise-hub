// Screen recordings and screenshots for video 84, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: Grace Mensah (Admin) at Northgate, with Messages on and Learning Bond off, names Rev. Angela Baptiste as the
// signer and sees the email Angela received; Angela, with no account, opens the link on a laptop and a phone, is refused without the
// authority box, accepts and is thanked; Grace finds the notice, sees the acceptance and turns Learning Bond on; then a used link, an
// unknown link and a failed load (L2-137, ADR 0078). No family's detail appears anywhere.
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
const ORG = 'Northgate Community Church Kids';
const GRACE = { personName: 'Grace Mensah', role: 'Admin', organizationId: 'org-northgate', email: 'grace@northgate.example' };
const ANGELA = { name: 'Rev. Angela Baptiste', title: 'Board chair', email: 'angela.baptiste@northgate.example' };
const SECTIONS = [
  ['What we collect', 'Learning Bond collects, with each guardian’s per-child consent, the guardian’s and each child’s social insurance number, whether the family filed last year’s tax return, and, for the child benefits check, household size, marital status and whether the family receives the Canada Child Benefit. Names, dates of birth, address, phone and email come from your roster.'],
  ['Where it goes', 'Social insurance numbers, income and benefit details are sent only to the RESP provider the guardian chooses and to the Government of Canada (Employment and Social Development Canada), and to the benefit programs the guardian applies to. They are encrypted with a key your organization never holds, decrypted only to send an application the guardian submitted, and destroyed once the provider or program has received it.'],
  ['What your organization sees', 'Your staff see each family’s completion status and the organization’s counts and totals. No one in your organization, including platform administrators, can read a social insurance number, income answer, marital status, benefit or dollar amount of a family. Every Learning Bond action is in your audit log without those values.'],
].map(([title, text]) => ({ title, text }));
const SENT = '2026-11-05T21:12:00Z';
const ACCEPTED = '2026-11-05T21:30:00Z';
const TOKEN = 'tok-angela';

const preview = (s) => ({
  title: `${GRACE.personName} asked you to accept the Learning Bond data-handling agreement`,
  text:
    `Hello ${s.name}. ${ORG} wants to offer Learning Bond, which helps families claim the Canada Learning Bond and child benefits. ` +
    'Someone with authority has to accept a one-page agreement about what it collects and where it goes. ' +
    `${GRACE.personName} named you, as ${s.title}. No PromiseHub account is needed. The link works once, for 14 days.`,
  action: 'Read and accept',
  footer: `${ORG} via PromiseHub`,
});

const newState = (who, x = {}) => ({
  who,
  modules: ['Roster', 'RollCall', 'QuickCards', 'Messages'],
  // The open request and its current link; null once used or cancelled.
  signer: null,
  token: null,
  acceptance: null,
  notices: [],
  fail: null,
  ...x,
});

/** A request Grace already sent, with Angela's link open. */
const waiting = () => ({ signer: { id: 'signer-1', ...ANGELA, sentAt: SENT, expiresAt: '2026-11-19T21:12:00Z' }, token: TOKEN });

/** The agreement, signer and module endpoints as the real API answers them (LearningBondAgreementHandler, LearningBondSignerHandler, LearningBondSignerLinkHandler, SaveModulesHandler). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    if (state.fail && path === state.fail) return route.fulfill({ status: 500 });
    // The signer's link: anonymous, whether Learning Bond is on or off (ADR 0078).
    const sign = path.match(/^\/api\/sign\/learning-bond\/([^/]+)(\/acceptances)?$/);
    if (sign) {
      const [, token, accepting] = sign;
      if (token !== TOKEN) return route.fulfill({ status: 404 });
      if (state.token !== TOKEN) return route.fulfill({ status: 410, json: { organization: ORG, message: `This link has expired. Ask ${ORG} to send a new one.` } });
      if (!accepting)
        return route.fulfill({ json: { organization: ORG, requestedBy: GRACE.personName, name: ANGELA.name, title: ANGELA.title, version: 2, effectiveOn: '2026-10-01', sections: SECTIONS } });
      if (!req.postDataJSON().authority) return route.fulfill({ status: 422, json: { errors: { authority: `Confirm you have authority to accept this agreement for ${ORG}.` } } });
      state.acceptance = { version: 2, acceptedBy: ANGELA.name, acceptedAt: ACCEPTED };
      state.signer = null;
      state.token = null;
      state.notices.push({ id: 'n-1', kind: 'agreement', text: `${ANGELA.name}, ${ANGELA.title}, accepted the Learning Bond data-handling agreement version 2.`, link: '/settings/learning-bond/agreement', createdAt: ACCEPTED, readAt: null });
      return route.fulfill({ status: 201, json: { organization: ORG, requestedBy: GRACE.personName, ...ANGELA, version: 2, acceptedAt: ACCEPTED } });
    }
    if (!state.who) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    const on = state.modules;
    if (path === '/api/me')
      return route.fulfill({ json: { personName: GRACE.personName, role: GRACE.role, organizationId: GRACE.organizationId, organizationName: ORG, plan: 'Free', modules: on, membershipId: 'm-grace', display: { theme: 'system', textSize: 'default', reduceMotion: false } } });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 1, households: 1, slipsDue: [], comingUp: [], tasks: [] } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: state.notices.filter((n) => !n.readAt).length, items: state.notices } });
    if (path.startsWith('/api/notifications/')) {
      for (const n of state.notices) n.readAt = ACCEPTED;
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/settings/modules') {
      if (method === 'GET') return route.fulfill({ json: { modules: CATALOG.map(([id, name, needs]) => ({ id, name, on: on.includes(id), needs })) } });
      const next = req.postDataJSON().on;
      if (next.includes('LearningBond') && !state.acceptance)
        return route.fulfill({ status: 422, json: { errors: [{ module: 'LearningBond', message: 'Accept the Learning Bond data-handling agreement first.' }] } });
      state.modules = CATALOG.map(([id]) => id).filter((id) => next.includes(id));
      return route.fulfill({ json: { on: next.length } });
    }
    if (path === '/api/learning-bond/agreement')
      return route.fulfill({
        json: { version: 2, effectiveOn: '2026-10-01', sections: SECTIONS, acceptance: state.acceptance, earlierAcceptance: null, signer: state.signer ? { ...state.signer, preview: preview(state.signer) } : null, moduleOn: on.includes('LearningBond') },
      });
    if (path === '/api/learning-bond/agreement/signers' && method === 'POST') {
      const b = req.postDataJSON();
      Object.assign(state, { signer: { id: 'signer-1', name: b.name, title: b.title, email: b.email, sentAt: SENT, expiresAt: '2026-11-19T21:12:00Z' }, token: TOKEN });
      return route.fulfill({ status: 201, json: { id: 'signer-1' } });
    }
    if (path === '/api/learning-bond') return on.includes('LearningBond') ? route.fulfill({ json: { on: true } }) : route.fulfill({ status: 404 });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const link = (demo, name) => app(demo).getByRole('link', { name, exact: true });
const row = (demo, name) =>
  app(demo).getByRole('list', { name: 'Modules' }).getByRole('listitem').filter({ has: app(demo).getByTestId('list-title').getByText(name, { exact: true }) });
const toggle = (demo, name) => app(demo).getByRole('switch', { name: `${name} on` });
const authority = (demo) => app(demo).getByRole('checkbox', { name: `I, ${ANGELA.name}, have authority to accept this agreement for ${ORG}` });

export default [
  {
    // Grace names Angela, then opens the email Angela received.
    name: 'email-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-grace'));
      await demo.go('/settings/learning-bond/agreement', { ready: false });
      await heading(demo, 'Learning Bond data-handling agreement');
      demo.mark();
      await demo.pause(1600);
      await demo.click(button(demo, 'Ask someone else to sign'));
      const dialog = app(demo).getByRole('dialog');
      await demo.type(dialog.getByLabel('Their name'), ANGELA.name);
      await demo.type(dialog.getByLabel('Their role or title'), ANGELA.title);
      await demo.type(dialog.getByLabel('Their email'), ANGELA.email);
      await demo.pause(800);
      await demo.click(dialog.getByRole('button', { name: 'Send the link' }));
      await app(demo).getByTestId('agreement-signer').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-waiting-signer');
      await demo.click(button(demo, 'See the email'));
      await app(demo).getByRole('dialog', { name: 'Email preview' }).waitFor();
      await demo.pause(3600);
      await shot(demo, 'desktop-email-preview');
      await demo.press('Escape');
      await demo.pause(1200);
    },
  },
  {
    // Angela opens the link with no account: refused without the box, then accepts and is thanked.
    name: 'signer-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState(null, waiting()));
      await demo.go(`/sign/learning-bond/${TOKEN}`, { ready: false });
      await heading(demo, `Accept the Learning Bond data-handling agreement for ${ORG}`);
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-signer');
      await demo.click(button(demo, 'Accept'));
      await app(demo).getByTestId('authority-error').waitFor();
      await app(demo).getByTestId('authority-error').scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'desktop-signer-invalid');
      await demo.click(authority(demo));
      await demo.click(button(demo, 'Accept'));
      await app(demo).getByTestId('signer-accepted').waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-signer-accepted');
    },
  },
  {
    // The same link on Angela's phone.
    name: 'signer-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState(null, waiting()));
      await demo.go(`/sign/learning-bond/${TOKEN}`, { ready: false });
      await heading(demo, `Accept the Learning Bond data-handling agreement for ${ORG}`);
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'phone-signer');
      await authority(demo).scrollIntoViewIfNeeded();
      await demo.pause(1200);
      await demo.click(authority(demo));
      await demo.click(button(demo, 'Accept'));
      await app(demo).getByTestId('signer-accepted').waitFor();
      await demo.pause(2400);
      await shot(demo, 'phone-signer-accepted');
    },
  },
  {
    // Grace finds the notice, sees Angela's acceptance and turns Learning Bond on.
    name: 'admin-desktop',
    run: async (demo) => {
      const state = newState('m-grace');
      state.acceptance = { version: 2, acceptedBy: ANGELA.name, acceptedAt: ACCEPTED };
      state.notices.push({ id: 'n-1', kind: 'agreement', text: `${ANGELA.name}, ${ANGELA.title}, accepted the Learning Bond data-handling agreement version 2.`, link: '/settings/learning-bond/agreement', createdAt: ACCEPTED, readAt: null });
      await fakeApi(demo, state);
      await demo.go('/notifications', { ready: false });
      await heading(demo, 'Notifications');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-notice');
      await demo.go('/settings/learning-bond/agreement', { ready: false });
      await app(demo).getByTestId('agreement-accepted').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-accepted-by-signer');
      await demo.click(link(demo, 'Turn on Learning Bond'));
      await heading(demo, 'Modules');
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      await demo.pause(800);
      await demo.click(toggle(demo, 'Learning Bond'));
      await demo.click(button(demo, 'Save changes'));
      await app(demo).getByText('Modules saved').waitFor();
      await demo.pause(2400);
    },
  },
  {
    // A used link, a link PromiseHub doesn't know, and a failed load with Try again.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState(null);
      await fakeApi(demo, state);
      await demo.go(`/sign/learning-bond/${TOKEN}`, { ready: false });
      await heading(demo, 'This link has expired');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-signer-expired');
      await demo.go('/sign/learning-bond/tok-unknown', { ready: false });
      await heading(demo, 'This link has expired');
      await demo.pause(2400);
      await shot(demo, 'desktop-signer-unknown');
      Object.assign(state, waiting(), { fail: `/api/sign/learning-bond/${TOKEN}` });
      await demo.go(`/sign/learning-bond/${TOKEN}`, { ready: false });
      await app(demo).getByRole('heading', { name: 'We couldn’t load the agreement' }).waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-signer-error');
      state.fail = null;
      await demo.click(button(demo, 'Try again'));
      await heading(demo, `Accept the Learning Bond data-handling agreement for ${ORG}`);
      await demo.pause(2000);
    },
  },
];
