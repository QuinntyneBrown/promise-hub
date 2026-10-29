// Screen recordings and screenshots for video 79, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Tom Nguyen (Admin) opens Settings, lands on Organization, edits the
// profile, uploads the logo and has a PDF refused, then edits the consent policy, how often mentors check in and the
// public website profile; Daniel Osei (Mentor) sees Check-ins due on his phone; then Grace Mensah at Northgate, where
// Learning, Mentoring and Public website are off, Jaylen's forbidden page and the invalid and taken states
// (L2-122 to L2-126, ADR 0073).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');
const LOGO = readFileSync(join(here, 'harbourview-logo.png'));
const SUITE = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const ZONES = ['America/St_Johns', 'America/Halifax', 'America/Toronto', 'America/Winnipeg', 'America/Regina', 'America/Edmonton', 'America/Vancouver', 'America/Whitehorse'];
const WORDING =
  'I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, and to staff contacting them about their program.';
const PEOPLE = {
  'm-tom': { personName: 'Tom Nguyen', role: 'Admin', org: 'harbourview' },
  'm-jaylen': { personName: 'Jaylen Okafor', role: 'SiteLead', org: 'harbourview' },
  'm-daniel': { personName: 'Daniel Osei', role: 'Mentor', org: 'harbourview' },
  'm-grace': { personName: 'Grace Mensah', role: 'Admin', org: 'northgate' },
};
const ORGS = {
  harbourview: { id: 'org-harbourview', name: 'Harbourview Youth Collective', city: 'Hamilton, Ontario', phone: '905-555-0100', slug: 'harbourview', plan: 'Standard' },
  northgate: { id: 'org-northgate', name: 'Northgate Community Church Kids', city: 'Burlington, Ontario', phone: '289-555-0190', slug: 'northgate', plan: 'Free' },
};
const YOUTH = [
  { id: 'c-mateo', name: 'Mateo Rivera', age: 9, programs: ['After-School Tutoring'], last: '2026-11-01' },
  { id: 'c-jordan', name: 'Jordan Thompson', age: 11, programs: ['After-School Tutoring'], last: '2026-10-27' },
  { id: 'c-sofia', name: 'Sofía Rivera', age: 12, programs: ['After-School Tutoring'], last: null },
  { id: 'c-yusuf', name: 'Yusuf Haddad', age: 13, programs: ['After-School Tutoring'], last: null },
];

const newState = (who, x = {}) => {
  const org = ORGS[PEOPLE[who].org];
  return {
    who,
    modules: org.id === 'org-harbourview' ? SUITE : ['Roster', 'RollCall', 'QuickCards'],
    profile: { name: org.name, city: org.city, contactEmail: null, phone: org.phone, timeZone: 'America/Toronto' },
    logo: null,
    consent: { consentAge: 18, wording: WORDING },
    checkInEveryDays: 14,
    website: { slug: org.slug, tagline: null, about: null, contactEmail: null },
    ...x,
  };
};

const allowed = (state) => ['Admin', 'ProgramDirector'].includes(PEOPLE[state.who].role);

/** The Settings › Organization endpoints as the real API answers them (OrganizationProfileHandler, OrganizationLogoHandler, ConsentPolicyHandler, MentoringSettingsHandler, WebsiteProfileHandler) and the mentor dashboard. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const p = PEOPLE[state.who];
    const org = ORGS[p.org];
    const settings = path.startsWith('/api/settings/');
    if (settings && !allowed(state)) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
    const gate = { '/api/settings/learning': 'Learning', '/api/settings/mentoring': 'Mentoring', '/api/settings/website': 'PublicWebsite' }[path];
    if (gate && !state.modules.includes(gate)) return route.fulfill({ status: 404 });
    if (path === '/api/me')
      return route.fulfill({
        json: { personName: p.personName, role: p.role, organizationId: org.id, organizationName: state.profile.name, plan: org.plan, modules: state.modules, membershipId: state.who, display: { theme: 'system', textSize: 'default', reduceMotion: false } },
      });
    if (path === '/api/settings/organization/profile') {
      if (req.method() === 'GET') return route.fulfill({ json: { ...state.profile, hasLogo: !!state.logo, logo: state.logo } });
      const b = req.postDataJSON();
      const errors = {};
      if (!b.name?.trim()) errors.name = 'Enter your organization’s name.';
      if (!b.city?.trim()) errors.city = 'Enter the city you work in.';
      if (b.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.contactEmail)) errors.contactEmail = 'Enter an email like hello@example.org.';
      if (b.phone && b.phone.replace(/\D/g, '').length !== 10) errors.phone = 'Include the area code, like 905-555-0100.';
      if (!ZONES.includes(b.timeZone)) errors.timeZone = 'Choose a time zone from the list.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      state.profile = { name: b.name.trim(), city: b.city.trim(), contactEmail: b.contactEmail, phone: b.phone, timeZone: b.timeZone };
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/settings/organization/logo') {
      if (req.method() === 'GET') return state.logo ? route.fulfill({ status: 200, contentType: 'image/png', body: LOGO }) : route.fulfill({ status: 404 });
      if (req.method() === 'DELETE') {
        state.logo = null;
        return route.fulfill({ status: 204 });
      }
      const body = req.postDataBuffer() ?? Buffer.alloc(0);
      const text = body.toString('latin1');
      const fileName = /filename="([^"]*)"/.exec(text)?.[1] ?? '';
      const start = text.indexOf('\r\n\r\n', text.indexOf('filename=')) + 4;
      const png = body.subarray(start, start + 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      if (!png) return route.fulfill({ status: 422, json: { errors: { file: 'Choose a PNG or JPEG of up to 1 MB.' } } });
      state.logo = { fileName, uploadedAt: '2026-11-05T21:12:00Z', uploadedBy: p.personName };
      return route.fulfill({ status: 201, json: state.logo });
    }
    if (path === '/api/settings/learning') {
      if (req.method() === 'GET') return route.fulfill({ json: state.consent });
      state.consent = req.postDataJSON();
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/settings/mentoring') {
      if (req.method() === 'GET') return route.fulfill({ json: { checkInEveryDays: state.checkInEveryDays } });
      state.checkInEveryDays = req.postDataJSON().checkInEveryDays;
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/settings/website') {
      if (req.method() === 'GET') return route.fulfill({ json: state.website });
      const b = req.postDataJSON();
      const errors = {};
      if (!/^[a-z][a-z0-9-]{2,39}$/.test(b.slug ?? '')) errors.slug = 'Use 3 to 40 lowercase letters, numbers and hyphens, starting with a letter.';
      else if (b.slug === 'northgate') errors.slug = 'Another organization uses this address. Choose another.';
      if (!b.tagline?.trim() || b.tagline.length > 120) errors.tagline = 'Write a tagline of up to 120 characters.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      state.website = { slug: b.slug, tagline: b.tagline.trim(), about: b.about, contactEmail: b.contactEmail };
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/mentoring/dashboard') {
      const cutoff = new Date(Date.parse('2026-11-05T12:00:00Z') - state.checkInEveryDays * 86400000).toISOString().slice(0, 10);
      const due = YOUTH.filter((y) => y.last === null || y.last <= cutoff)
        .sort((a, b) => (a.last === null ? 0 : 1) - (b.last === null ? 0 : 1) || (a.last ?? '').localeCompare(b.last ?? '') || a.name.localeCompare(b.name))
        .map((y) => ({ childId: y.id, youthName: y.name, lastCheckIn: y.last }));
      return route.fulfill({
        json: {
          youth: YOUTH.map(({ id, name, age, programs }) => ({ id, name, age, programs })),
          cohorts: [{ programId: 'p-tutoring', name: 'After-School Tutoring', term: 'Fall 2026', role: 'Supporting', youthCount: 4 }],
          checkedInThisWeek: 3,
          recentActivity: [],
          followUps: [{ childId: 'c-mateo', youthName: 'Mateo Rivera', followUpOn: '2026-11-12', overdue: false }],
          checkInEveryDays: state.checkInEveryDays,
          checkInsDue: due,
        },
      });
    }
    if (path === '/api/mentoring/reviews') return route.fulfill({ json: { items: [] } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const dialog = (demo, name) => app(demo).getByRole('dialog', { name });

async function fill(demo, scope, label, value) {
  const field = scope.getByLabel(label);
  await field.fill('');
  if (value) await demo.type(field, value);
}

export default [
  {
    // Tom opens Settings, lands on Organization and edits the profile.
    name: 'profile-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings', { ready: false });
      await heading(demo, 'Organization');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-organization');
      await demo.click(button(demo, 'Edit profile'));
      const d = dialog(demo, 'Edit organization profile');
      await d.waitFor();
      await demo.pause(1200);
      await fill(demo, d, /^Contact email/, 'hello@harbourview.example');
      await fill(demo, d, /^Phone/, '905-555-0111');
      await d.getByLabel('Time zone').selectOption({ label: 'Atlantic (Halifax)' });
      await demo.pause(1000);
      await shot(demo, 'desktop-profile-dialog');
      await demo.click(d.getByRole('button', { name: 'Save profile' }));
      await app(demo).getByText('Organization profile saved').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-profile-saved');
      await demo.pause(1000);
    },
  },
  {
    // Tom uploads the logo; then a PDF is refused.
    name: 'logo-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/settings/organization', { ready: false });
      await heading(demo, 'Organization');
      demo.mark();
      await demo.pause(1600);
      await shot(demo, 'desktop-no-logo');
      await app(demo).getByLabel('Choose image').setInputFiles({ name: 'harbourview-logo.png', mimeType: 'image/png', buffer: LOGO });
      await app(demo).getByText('Logo saved').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-logo');
      await app(demo).getByLabel('Choose image').setInputFiles({ name: 'harbourview-flyer.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 flyer') });
      await app(demo).getByText('wasn’t uploaded').waitFor();
      await app(demo).getByText('wasn’t uploaded').scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'desktop-logo-invalid');
    },
  },
  {
    // Tom edits the consent policy, how often mentors check in, then the public website profile once it is on.
    name: 'defaults-desktop',
    run: async (demo) => {
      const state = newState('m-tom');
      await fakeApi(demo, state);
      await demo.go('/settings/organization', { ready: false });
      await heading(demo, 'Organization');
      demo.mark();
      await app(demo).getByRole('region', { name: 'Learning' }).scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await demo.click(button(demo, 'Edit consent policy'));
      const consent = dialog(demo, 'Edit consent policy');
      await consent.waitFor();
      await consent.getByLabel('Consent needed under').selectOption({ label: '16 years' });
      await demo.pause(1000);
      await demo.click(consent.getByRole('button', { name: 'Save policy' }));
      await app(demo).getByText('Consent policy saved').waitFor();
      await demo.pause(1400);
      await demo.click(button(demo, 'Edit mentoring defaults'));
      const mentoring = dialog(demo, 'Edit mentoring defaults');
      await mentoring.waitFor();
      await mentoring.getByLabel('Mentors check in with each youth').selectOption({ label: 'Every 7 days' });
      await demo.pause(1200);
      await shot(demo, 'desktop-mentoring-dialog');
      await demo.click(mentoring.getByRole('button', { name: 'Save defaults' }));
      await app(demo).getByText('Mentoring defaults saved').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-defaults-saved');
      demo.note('Public website turned on');
      state.modules = [...SUITE, 'PublicWebsite'];
      await demo.go('/settings/organization', { ready: false });
      await heading(demo, 'Organization');
      await app(demo).getByRole('region', { name: 'Public website' }).scrollIntoViewIfNeeded();
      await demo.pause(1400);
      demo.note('');
      await demo.click(button(demo, 'Edit website profile'));
      const site = dialog(demo, 'Edit website profile');
      await site.waitFor();
      await fill(demo, site, 'Website address', 'harbourview-youth');
      await fill(demo, site, 'Tagline', 'Tutoring, sports and mentoring for Hamilton kids.');
      await fill(demo, site, /^Public email/, 'hello@harbourview.example');
      await demo.pause(1000);
      await shot(demo, 'desktop-website-dialog');
      await demo.click(site.getByRole('button', { name: 'Save website profile' }));
      await app(demo).getByText('Website profile saved').waitFor();
      await app(demo).getByRole('region', { name: 'Public website' }).scrollIntoViewIfNeeded();
      await demo.pause(2000);
      await shot(demo, 'desktop-website-saved');
    },
  },
  {
    // Daniel on his phone: Check-ins due at 14 days, then after Tom chose 7.
    name: 'mentor-phone',
    phone: true,
    run: async (demo) => {
      const state = newState('m-daniel');
      await fakeApi(demo, state);
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      demo.mark();
      await app(demo).getByRole('region', { name: 'Check-ins due' }).scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'phone-check-ins-due');
      demo.note('Every 7 days');
      state.checkInEveryDays = 7;
      await demo.go('/mentoring', { ready: false });
      await heading(demo, 'Mentoring');
      await app(demo).getByRole('region', { name: 'Check-ins due' }).scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'phone-check-ins-due-7');
      demo.note('');
    },
  },
  {
    // Grace at Northgate (modules off), Jaylen's forbidden page, an invalid profile and a taken address.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-grace');
      await fakeApi(demo, state);
      await demo.go('/settings/organization', { ready: false });
      await heading(demo, 'Organization');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-northgate');
      Object.assign(state, newState('m-jaylen'));
      await demo.go('/settings/organization', { ready: false });
      await app(demo).getByRole('heading', { name: 'Admins set up the organization' }).waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-forbidden');
      Object.assign(state, newState('m-tom', { modules: [...SUITE, 'PublicWebsite'] }));
      await demo.go('/settings/organization', { ready: false });
      await heading(demo, 'Organization');
      await demo.click(button(demo, 'Edit profile'));
      const d = dialog(demo, 'Edit organization profile');
      await d.waitFor();
      await fill(demo, d, 'Organization name', '');
      await fill(demo, d, /^Phone/, '555-0100');
      await demo.click(d.getByRole('button', { name: 'Save profile' }));
      await d.getByText('Fix these to continue').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-profile-invalid');
      await demo.click(d.getByRole('button', { name: 'Cancel' }));
      await app(demo).getByRole('region', { name: 'Public website' }).scrollIntoViewIfNeeded();
      await demo.click(button(demo, 'Edit website profile'));
      const site = dialog(demo, 'Edit website profile');
      await site.waitFor();
      await fill(demo, site, 'Website address', 'northgate');
      await fill(demo, site, 'Tagline', 'Tutoring and sports for Hamilton kids.');
      await demo.click(site.getByRole('button', { name: 'Save website profile' }));
      await site.getByText('Another organization uses this address. Choose another.').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-website-taken');
    },
  },
];
