// Screen recordings and screenshots for video 83, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Grace Mensah (Admin) at Northgate, with Messages on and Learning Bond
// off, is refused by Modules, reads the data-handling agreement, is refused without the authority box, accepts and turns
// Learning Bond on; she also names Rev. Angela Baptiste as the signer and resends the link. Tom Nguyen (Admin) at
// Harbourview opens Settings › Learning Bond, chooses coverage and status roles, edits the invitation's sender name and,
// once version 3 of the agreement is published, accepts it so Launch is open again; then the phone, error and forbidden
// states (L2-135 to L2-139, ADR 0076, ADR 0077). No social insurance number or family's detail appears anywhere.
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
const SUITE = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring', 'LearningBond'];
const PEOPLE = {
  'm-tom': { personName: 'Tom Nguyen', role: 'Admin', org: 'org-harbourview' },
  'm-jaylen': { personName: 'Jaylen Okafor', role: 'SiteLead', org: 'org-harbourview' },
  'm-grace': { personName: 'Grace Mensah', role: 'Admin', org: 'org-northgate' },
};
const ORGS = {
  'org-harbourview': { name: 'Harbourview Youth Collective', city: 'Hamilton', plan: 'Standard', languages: ['en', 'es', 'fr'] },
  'org-northgate': { name: 'Northgate Community Church Kids', city: 'Burlington', plan: 'Free', languages: ['es'] },
};
// The running programs and the households each reaches (LearningBondCoverage over the seed).
const PROGRAMS = {
  'org-harbourview': [
    { id: 'p-tutoring', name: 'After-School Tutoring', households: ['hh-rivera', 'hh-thompson', 'hh-haddad'] },
    { id: 'p-sports', name: 'Saturday Sports', households: ['hh-tran'] },
    { id: 'p-winter', name: 'Winter Camp 2026', households: [] },
  ],
  'org-northgate': [{ id: 'p-kids-club', name: 'Kids Club', households: ['hh-ng-rivera'] }],
};
const SECTIONS = [
  ['What we collect', 'Learning Bond collects, with each guardian’s per-child consent, the guardian’s and each child’s social insurance number, whether the family filed last year’s tax return, and, for the child benefits check, household size, marital status and whether the family receives the Canada Child Benefit. Names, dates of birth, address, phone and email come from your roster.'],
  ['Where it goes', 'Social insurance numbers, income and benefit details are sent only to the RESP provider the guardian chooses and to the Government of Canada (Employment and Social Development Canada), and to the benefit programs the guardian applies to. They are encrypted with a key your organization never holds, decrypted only to send an application the guardian submitted, and destroyed once the provider or program has received it.'],
  ['What your organization sees', 'Your staff see each family’s completion status and the organization’s counts and totals. No one in your organization, including platform administrators, can read a social insurance number, income answer, marital status, benefit or dollar amount of a family. Every Learning Bond action is in your audit log without those values.'],
].map(([title, text]) => ({ title, text }));
const NOW = '2026-11-05T21:12:00Z';
const LINK = 'promisehub.ca/lb/4r7k9x';
const TEXTS = {
  en: { name: 'English', sms: (s) => `${s}: Maya may be owed up to $2,000 for school after high school. It costs nothing. Tap to check: ${LINK} (STOP to opt out)`, title: 'Maya may be owed up to $2,000 for school after high school', text: 'Hi Alex. The Government of Canada puts the Canada Learning Bond into an RESP for families with lower incomes. It costs nothing and you don’t need to put in any money. Check in about 15 minutes on your phone.', action: 'Check now', footer: (s, o) => `${s} via PromiseHub · ${o} · Unsubscribe` },
  es: { name: 'Spanish', sms: (s) => `${s}: Maya podría tener derecho a hasta $2,000 para estudiar después de la secundaria. No cuesta nada. Toque para comprobarlo: ${LINK} (STOP para salir)`, title: 'Maya podría tener derecho a hasta $2,000 para estudiar', text: 'Hola, Alex. El Gobierno de Canadá deposita el Bono de Estudios Canadiense en un RESP para familias con ingresos más bajos. No cuesta nada y no hace falta aportar dinero. Compruébelo en unos 15 minutos desde su teléfono.', action: 'Comprobar ahora', footer: (s, o) => `${s} a través de PromiseHub · ${o} · Dejar de recibir correos` },
  fr: { name: 'French', sms: (s) => `${s} : Maya pourrait recevoir jusqu’à 2 000 $ pour ses études après le secondaire. C’est gratuit. Touchez pour vérifier : ${LINK} (STOP pour arrêter)`, title: 'Maya pourrait recevoir jusqu’à 2 000 $ pour ses études', text: 'Bonjour Alex. Le gouvernement du Canada verse le Bon d’études canadien dans un REEE pour les familles à revenu modeste. C’est gratuit et vous n’avez rien à verser. Vérifiez en 15 minutes environ sur votre téléphone.', action: 'Vérifier maintenant', footer: (s, o) => `${s} via PromiseHub · ${o} · Se désabonner` },
};
const GSM7 = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const segments = (t) => {
  const [one, many] = [...t].every((c) => GSM7.includes(c)) ? [160, 153] : [70, 67];
  return t.length <= one ? 1 : Math.ceil(t.length / many);
};

const newState = (who, x = {}) => ({
  who,
  version: 2,
  effectiveOn: '2026-10-01',
  modules: { 'org-harbourview': [...SUITE], 'org-northgate': ['Roster', 'RollCall', 'QuickCards', 'Messages'] },
  acceptances: [{ org: 'org-harbourview', version: 2, acceptedBy: 'Tom Nguyen', acceptedAt: '2026-10-29T15:00:00Z' }],
  signers: {},
  settings: {},
  fail: null,
  ...x,
});

/** The Learning Bond and module endpoints as the real API answers them (LearningBondAgreementHandler, LearningBondSignerHandler, LearningBondSettingsHandler, LearningBondInvitationHandler, LearningBondOverviewHandler, SaveModulesHandler). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    if (state.fail && path === state.fail) return route.fulfill({ status: 500 });
    if (!state.who) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    const p = PEOPLE[state.who];
    const orgId = p.org;
    const org = ORGS[orgId];
    const on = state.modules[orgId];
    const admin = p.role === 'Admin';
    const settings = state.settings[orgId] ?? { coverage: 'AllPrograms', programIds: [], statusRoles: ['Admin', 'ProgramDirector'], senderName: null };
    const sender = settings.senderName ?? (org.name.length <= 30 ? org.name : org.name.slice(0, 30).slice(0, org.name.slice(0, 30).lastIndexOf(' ')));
    const own = state.acceptances.filter((a) => a.org === orgId).sort((a, b) => b.version - a.version);
    const dto = (a) => (a ? { version: a.version, acceptedBy: a.acceptedBy, acceptedAt: a.acceptedAt } : null);
    if (path === '/api/me')
      return route.fulfill({ json: { personName: p.personName, role: p.role, organizationId: orgId, organizationName: org.name, plan: org.plan, modules: on, membershipId: state.who, display: { theme: 'system', textSize: 'default', reduceMotion: false } } });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 1, households: 1, slipsDue: [], comingUp: [], tasks: [] } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/settings/modules') {
      if (!admin) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      if (method === 'GET') return route.fulfill({ json: { modules: CATALOG.map(([id, name, needs]) => ({ id, name, on: on.includes(id), needs })) } });
      const next = req.postDataJSON().on;
      if (next.includes('LearningBond') && !on.includes('LearningBond') && !own.some((a) => a.version === state.version))
        return route.fulfill({ status: 422, json: { errors: [{ module: 'LearningBond', message: 'Accept the Learning Bond data-handling agreement first.' }] } });
      state.modules[orgId] = CATALOG.map(([id]) => id).filter((id) => next.includes(id));
      return route.fulfill({ json: { on: next.length } });
    }
    if (path.startsWith('/api/learning-bond/agreement')) {
      if (!admin) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      if (path === '/api/learning-bond/agreement') {
        const current = own.find((a) => a.version === state.version);
        return route.fulfill({ json: { version: state.version, effectiveOn: state.effectiveOn, sections: SECTIONS, acceptance: dto(current), earlierAcceptance: current ? null : dto(own[0]), signer: state.signers[orgId] ?? null, moduleOn: on.includes('LearningBond') } });
      }
      if (path.endsWith('/acceptances')) {
        if (!req.postDataJSON().authority) return route.fulfill({ status: 422, json: { errors: { authority: 'Confirm you have authority to accept this agreement, or ask someone else to sign.' } } });
        state.acceptances.push({ org: orgId, version: state.version, acceptedBy: p.personName, acceptedAt: NOW });
        delete state.signers[orgId];
        return route.fulfill({ status: 201, json: { id: 'acceptance' } });
      }
      if (path.endsWith('/signers') && method === 'POST') {
        const b = req.postDataJSON();
        state.signers[orgId] = { id: 'signer-1', name: b.name, title: b.title, email: b.email, sentAt: NOW, expiresAt: '2026-11-19T21:12:00Z' };
        return route.fulfill({ status: 201, json: { id: 'signer-1' } });
      }
      if (path.endsWith('/resend')) {
        state.signers[orgId] = { ...state.signers[orgId], sentAt: '2026-11-05T21:14:00Z' };
        return route.fulfill({ status: 204 });
      }
      delete state.signers[orgId];
      return route.fulfill({ status: 204 });
    }
    if (path.startsWith('/api/learning-bond/')) {
      if (!admin) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      if (!on.includes('LearningBond')) return route.fulfill({ status: 404 });
      const programs = PROGRAMS[orgId];
      if (path === '/api/learning-bond/settings' && method === 'GET')
        return route.fulfill({ json: { ...settings, programs: programs.map((x) => ({ id: x.id, name: x.name, households: x.households.length })), allHouseholds: new Set(programs.flatMap((x) => x.households)).size } });
      if (path === '/api/learning-bond/settings') {
        const b = req.postDataJSON();
        if (b.coverage === 'ChosenPrograms' && !b.programIds.length) return route.fulfill({ status: 422, json: { errors: { programIds: 'Choose at least one program.' } } });
        const roles = ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker', 'VolunteerCoordinator'].filter((r) => ['Admin', 'ProgramDirector'].includes(r) || b.statusRoles.includes(r));
        state.settings[orgId] = { ...settings, coverage: b.coverage, programIds: b.coverage === 'AllPrograms' ? [] : b.programIds, statusRoles: roles };
        return route.fulfill({ status: 204 });
      }
      if (path === '/api/learning-bond/invitation' && method === 'GET') {
        const place = `${org.name}, ${org.city}`;
        return route.fulfill({
          json: {
            senderName: sender,
            languages: org.languages.map((code) => {
              const t = TEXTS[code];
              const sms = t.sms(sender);
              return { code, name: t.name, sms, smsCharacters: sms.length, smsSegments: segments(sms), emailTitle: t.title, emailText: t.text, emailAction: t.action, emailFooter: t.footer(sender, place) };
            }),
          },
        });
      }
      if (path === '/api/learning-bond/invitation') {
        const name = (req.postDataJSON().senderName ?? '').trim();
        if (!name || name.length > 30 || /[^\p{L}\p{N} &'’.-]/u.test(name) || /[\p{L}\p{N}-]\.\p{L}{2,}/u.test(name))
          return route.fulfill({ status: 422, json: { errors: { senderName: 'Use 1 to 30 letters, numbers and spaces.' } } });
        state.settings[orgId] = { ...settings, senderName: name };
        return route.fulfill({ status: 204 });
      }
      if (path === '/api/learning-bond/overview') {
        const pending = own[0]?.version !== state.version;
        const chosen = settings.coverage === 'ChosenPrograms' ? programs.filter((x) => settings.programIds.includes(x.id)) : programs;
        return route.fulfill({
          json: {
            agreementVersion: state.version,
            acceptance: dto(own[0]),
            pendingVersion: pending ? state.version : null,
            pendingEffectiveOn: pending ? state.effectiveOn : null,
            coverage: settings.coverage,
            programs: settings.coverage === 'ChosenPrograms' ? chosen.map((x) => x.name) : [],
            households: new Set(chosen.flatMap((x) => x.households)).size,
            statusRoles: settings.statusRoles,
            senderName: sender,
            languages: org.languages,
            launchBlocked: pending ? 'A new version of the agreement needs accepting.' : null,
          },
        });
      }
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
const authority = (demo, org) => app(demo).getByRole('checkbox', { name: `I have authority to accept this agreement for ${org}` });

export default [
  {
    // Grace at Northgate: refused by Modules, reads the agreement, is refused without the box, accepts and turns Learning Bond on.
    name: 'accept-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-grace'));
      await demo.go('/settings/modules', { ready: false });
      await heading(demo, 'Modules');
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      demo.mark();
      await demo.pause(1600);
      await demo.click(toggle(demo, 'Learning Bond'));
      await demo.click(button(demo, 'Save changes'));
      await row(demo, 'Learning Bond').getByText('Accept the Learning Bond data-handling agreement first.').waitFor();
      await row(demo, 'Learning Bond').scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'desktop-modules-refused');
      await demo.click(link(demo, 'Read the agreement'));
      await heading(demo, 'Learning Bond data-handling agreement');
      await demo.pause(2600);
      await shot(demo, 'desktop-agreement');
      await demo.click(button(demo, 'Accept'));
      await app(demo).getByTestId('authority-error').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-agreement-invalid');
      await demo.click(authority(demo, 'Northgate Community Church Kids'));
      await demo.click(button(demo, 'Accept'));
      await app(demo).getByTestId('agreement-accepted').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-accepted-off');
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
    // Grace names Rev. Angela Baptiste as the signer, then resends the link.
    name: 'signer-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-grace'));
      await demo.go('/settings/learning-bond/agreement', { ready: false });
      await heading(demo, 'Learning Bond data-handling agreement');
      demo.mark();
      await demo.pause(1400);
      await demo.click(button(demo, 'Ask someone else to sign'));
      const dialog = app(demo).getByRole('dialog', { name: 'Ask someone else to sign' });
      await demo.type(dialog.getByLabel('Their name'), 'Rev. Angela Baptiste');
      await demo.type(dialog.getByLabel('Their role or title'), 'Board chair');
      await demo.type(dialog.getByLabel('Their email'), 'angela.baptiste@northgate.example');
      await demo.pause(800);
      await shot(demo, 'desktop-signer-dialog');
      await demo.click(dialog.getByRole('button', { name: 'Send the link' }));
      await app(demo).getByTestId('agreement-signer').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-waiting-signer');
      await demo.click(app(demo).getByTestId('agreement-signer').getByRole('button', { name: 'Resend' }));
      await app(demo).getByText('Link sent again to Rev. Angela Baptiste').waitFor();
      await demo.pause(2400);
    },
  },
  {
    // Tom at Harbourview: the hub, then coverage with two programs and two more roles.
    name: 'coverage-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings/learning-bond', { ready: false });
      await heading(demo, 'Learning Bond');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-hub');
      await demo.click(link(demo, 'Change coverage'));
      await heading(demo, 'Coverage');
      await demo.pause(1800);
      await shot(demo, 'desktop-coverage');
      await demo.click(app(demo).getByRole('radio', { name: /^Chosen programs/ }));
      const programs = app(demo).getByRole('group', { name: 'Chosen programs' });
      await demo.click(programs.getByRole('checkbox', { name: /^After-School Tutoring/ }));
      await demo.click(programs.getByRole('checkbox', { name: /^Saturday Sports/ }));
      const roles = app(demo).getByRole('group', { name: 'Who sees each family’s status' });
      await demo.click(roles.getByRole('checkbox', { name: /^Site lead/ }));
      await demo.click(roles.getByRole('checkbox', { name: /^Youth worker/ }));
      await demo.click(button(demo, 'Save changes'));
      await app(demo).getByText('Learning Bond settings saved').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-coverage-saved');
    },
  },
  {
    // Tom previews the invitation in English, Spanish and French, and changes the sender name.
    name: 'invitation-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings/learning-bond/invitation', { ready: false });
      await heading(demo, 'Guardian invitation');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-invitation');
      const field = app(demo).getByLabel('Sender name');
      await demo.click(field);
      await field.fill('');
      await demo.type(field, 'Harbourview After-School');
      await demo.pause(1200);
      await demo.click(button(demo, 'Save'));
      await app(demo).getByText('Sender name saved').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-invitation-saved');
    },
  },
  {
    // Version 3 of the agreement is published: Launch is disabled until Tom accepts it.
    name: 'new-version-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom', { version: 3, effectiveOn: '2026-11-01' }));
      await demo.go('/settings/learning-bond', { ready: false });
      await heading(demo, 'Learning Bond');
      demo.mark();
      await demo.pause(3000);
      await shot(demo, 'desktop-new-version');
      await demo.click(link(demo, 'Read and accept version 3'));
      await heading(demo, 'Learning Bond data-handling agreement');
      await demo.pause(1200);
      await demo.click(authority(demo, 'Harbourview Youth Collective'));
      await demo.click(button(demo, 'Accept'));
      await app(demo).getByTestId('agreement-accepted').waitFor();
      await demo.pause(1600);
      await demo.click(link(demo, 'Back to Learning Bond'));
      await heading(demo, 'Learning Bond');
      await demo.pause(2400);
    },
  },
  {
    // The hub and the invitation on Tom's phone.
    name: 'hub-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings/learning-bond', { ready: false });
      await heading(demo, 'Learning Bond');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'phone-hub');
      await demo.go('/settings/learning-bond/invitation', { ready: false });
      await heading(demo, 'Guardian invitation');
      await demo.pause(2600);
      await shot(demo, 'phone-invitation');
    },
  },
  {
    // A coverage save with no program, a sender name with a link, a failed load and a site lead's forbidden page.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-tom');
      await fakeApi(demo, state);
      await demo.go('/settings/learning-bond/coverage', { ready: false });
      await heading(demo, 'Coverage');
      demo.mark();
      await demo.click(app(demo).getByRole('radio', { name: /^Chosen programs/ }));
      await demo.click(button(demo, 'Save changes'));
      await app(demo).getByText('Choose at least one program.').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-coverage-invalid');
      await demo.go('/settings/learning-bond/invitation', { ready: false });
      await heading(demo, 'Guardian invitation');
      const field = app(demo).getByLabel('Sender name');
      await field.fill('');
      await demo.type(field, 'Harbourview hbv.ph/join');
      await demo.click(button(demo, 'Save'));
      await app(demo).getByTestId('sender-name-error').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-invitation-invalid');
      state.fail = '/api/learning-bond/overview';
      await demo.go('/settings/learning-bond', { ready: false });
      await app(demo).getByRole('heading', { name: 'We couldn’t load Learning Bond settings' }).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-error');
      state.fail = null;
      state.who = 'm-jaylen';
      await demo.go('/settings/learning-bond/agreement', { ready: false });
      await app(demo).getByRole('heading', { name: 'Admins accept the agreement' }).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-forbidden');
    },
  },
];
