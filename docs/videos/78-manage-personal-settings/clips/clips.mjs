// Screen recordings and screenshots for video 78, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Jaylen Okafor (Site lead) opens Your account, edits his profile and
// changes his password; Sofía Rivera (Youth) sees her name read-only, then picks Dark and Larger text on her phone and
// saves; then her notification choices with Messages on and off, an invalid profile and a display save that failed
// (L2-117 to L2-121, ADR 0072).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ALL = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const ORG = 'Harbourview Youth Collective';
const SEED = 'harbour-tutoring-2026';
const PEOPLE = {
  'm-jaylen': { personName: 'Jaylen Okafor', email: 'jaylen@harbourview.example', role: 'SiteLead', mobile: '905-555-0181', twoStepOn: false },
  'm-sofia': { personName: 'Sofía Rivera', email: 'sofia@harbourview.example', role: 'Youth', mobile: null, twoStepOn: false },
};
const KINDS = [
  { key: 'learning', name: 'Grades and badges', hint: 'When your work is graded, a quiz score is approved or you earn a badge.', modules: ['Learning'] },
  { key: 'assignments', name: 'Assigned work', hint: 'When your mentor assigns you a lesson, quiz or assignment.', modules: ['Learning', 'Mentoring'] },
  { key: 'messages', name: 'Messages', hint: 'When someone writes to you in a conversation.', modules: ['Messages', 'Mentoring'] },
  { key: 'announcements', name: 'Announcements', hint: 'When an announcement for your programs is posted.', modules: ['Messages'] },
];

const newState = (who, x = {}) => ({
  who,
  modules: ALL,
  password: SEED,
  display: { theme: 'system', textSize: 'default', reduceMotion: false },
  profile: { name: PEOPLE[who].personName, mobile: PEOPLE[who].mobile },
  fail: new Set(),
  ...x,
});

/** The personal-settings endpoints as the real API answers them (ProfileHandler, ChangePasswordHandler, DisplayPreferencesHandler). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const p = PEOPLE[state.who];
    if (state.fail.has(`${req.method()} ${path}`)) return route.fulfill({ status: 500, json: { code: 'server-error', reference: 'demo' } });
    if (path === '/api/me')
      return route.fulfill({
        json: { personName: state.profile.name, role: p.role, organizationId: 'org-harbourview', organizationName: ORG, plan: 'Standard', modules: state.modules, membershipId: state.who, display: state.display },
      });
    if (path === '/api/me/account')
      return route.fulfill({ json: { name: state.profile.name, email: p.email, role: p.role, organization: ORG, mobile: state.profile.mobile, twoStepOn: p.twoStepOn, recoveryCodesLeft: 0 } });
    if (path === '/api/me/profile') {
      const b = req.postDataJSON();
      const name = (b.name ?? '').trim();
      const mobile = (b.mobile ?? '').trim();
      const errors = {};
      if (!name) errors.name = 'Enter your name.';
      else if (p.role === 'Youth' && name !== state.profile.name) errors.name = 'Your name comes from your record. Ask staff to change it.';
      if (mobile && mobile.replace(/\D/g, '').length !== 10) errors.mobile = 'Include the area code, like 905-555-0101.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      state.profile = { name, mobile: mobile || null };
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/me/password') {
      const b = req.postDataJSON();
      if (b.current !== state.password) return route.fulfill({ status: 422, json: { errors: { current: 'That isn’t your current password.' } } });
      if (b.password.length < 12) return route.fulfill({ status: 422, json: { errors: { password: 'Use at least 12 characters.' } } });
      if (b.repeat !== b.password) return route.fulfill({ status: 422, json: { errors: { repeat: 'The two passwords don’t match.' } } });
      state.password = b.password;
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/me/display') {
      if (req.method() === 'GET') return route.fulfill({ json: state.display });
      state.display = req.postDataJSON();
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/notifications/preferences') {
      const offered = KINDS.filter((k) => k.modules.every((m) => state.modules.includes(m)));
      if (req.method() === 'GET') return route.fulfill({ json: { kinds: offered.map(({ key, name, hint }) => ({ key, name, hint, inApp: key !== 'announcements' })) } });
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/auth/sign-out') return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const link = (demo, name) => app(demo).getByRole('link', { name, exact: true });
const radio = (demo, group, name) => app(demo).getByRole('group', { name: group }).getByRole('radio', { name: new RegExp(`^${name}(\\s|$)`) });

async function fill(demo, label, value) {
  const field = app(demo).getByLabel(label, { exact: true });
  await field.fill('');
  if (value) await demo.type(field, value);
}

export default [
  {
    // Jaylen opens Your account and edits his name and mobile; the top bar shows the new name.
    name: 'profile-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-jaylen'));
      await demo.go('/account', { ready: false });
      await heading(demo, 'Your account');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'desktop-account');
      await demo.click(link(demo, 'Edit profile'));
      await heading(demo, 'Profile');
      await demo.pause(1600);
      await shot(demo, 'desktop-profile');
      await fill(demo, 'Name', 'Jaylen O. Okafor');
      await fill(demo, 'Mobile (optional)', '905-555-0182');
      await demo.click(button(demo, 'Save changes'));
      await app(demo).getByText('Profile saved').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-profile-saved');
      await demo.pause(1200);
    },
  },
  {
    // Jaylen changes his password: a wrong current password first, then the right one.
    name: 'password-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-jaylen'));
      await demo.go('/account', { ready: false });
      await heading(demo, 'Your account');
      demo.mark();
      await demo.pause(1000);
      await demo.click(button(demo, 'Change password'));
      const dialog = app(demo).getByRole('dialog');
      await dialog.getByRole('heading', { name: 'Change your password' }).waitFor();
      await demo.pause(1200);
      await shot(demo, 'desktop-password');
      await demo.type(dialog.getByLabel('Current password'), 'harbour-2025');
      await demo.type(dialog.getByLabel('New password'), 'lanterns over the harbour');
      await demo.type(dialog.getByLabel('Repeat it'), 'lanterns over the harbour');
      await demo.click(dialog.getByRole('button', { name: 'Change password' }));
      await dialog.getByText('That isn’t your current password.').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-password-invalid');
      await dialog.getByLabel('Current password').fill('');
      await demo.type(dialog.getByLabel('Current password'), SEED);
      await demo.click(dialog.getByRole('button', { name: 'Change password' }));
      await app(demo).getByText('Password changed').waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-password-changed');
      await demo.pause(1400);
    },
  },
  {
    // Sofía on her phone: her name is read-only, she picks Dark and Larger text, saves, and it stays after a reload.
    name: 'display-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState('m-sofia'));
      await demo.go('/account/profile', { ready: false });
      await heading(demo, 'Profile');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'phone-youth-profile');
      await demo.go('/account', { ready: false });
      await heading(demo, 'Your account');
      await demo.pause(800);
      await demo.click(link(demo, 'Change display'));
      await heading(demo, 'Display');
      await demo.pause(1200);
      await shot(demo, 'phone-display');
      await demo.click(radio(demo, 'Theme', 'Dark'));
      await demo.pause(1600);
      await shot(demo, 'phone-dark');
      await demo.click(radio(demo, 'Text size', 'Larger'));
      await demo.pause(1600);
      await shot(demo, 'phone-larger');
      await demo.click(button(demo, 'Save changes'));
      await app(demo).getByText('Display saved').waitFor();
      await demo.pause(1600);
      demo.note('After a reload');
      await demo.go('/account', { ready: false });
      await heading(demo, 'Your account');
      await demo.pause(2000);
      await shot(demo, 'phone-account-dark');
      demo.note('');
      await demo.pause(800);
    },
  },
  {
    // Notification choices with Messages on and off, then an invalid profile and a display save that failed.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-sofia');
      await fakeApi(demo, state);
      await demo.go('/account', { ready: false });
      await heading(demo, 'Your account');
      demo.mark();
      await demo.click(link(demo, 'Choose notifications'));
      await heading(demo, 'Notifications');
      await demo.pause(2000);
      await shot(demo, 'desktop-notifications');
      demo.note('Messages turned off');
      state.modules = ALL.filter((m) => m !== 'Messages');
      await demo.go('/account/notifications', { ready: false });
      await heading(demo, 'Notifications');
      await demo.pause(2200);
      await shot(demo, 'desktop-messages-off');
      demo.note('');
      state.who = 'm-jaylen';
      state.profile = { name: 'Jaylen Okafor', mobile: '905-555-0181' };
      await demo.go('/account/profile', { ready: false });
      await heading(demo, 'Profile');
      await fill(demo, 'Name', '');
      await fill(demo, 'Mobile (optional)', '555-0181');
      await demo.click(button(demo, 'Save changes'));
      await app(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-profile-invalid');
      state.fail.add('PUT /api/me/display');
      await demo.go('/account/display', { ready: false });
      await heading(demo, 'Display');
      await demo.click(radio(demo, 'Theme', 'Dark'));
      await demo.click(button(demo, 'Save changes'));
      await app(demo).getByText('That didn’t go through').waitFor();
      await app(demo).getByRole('heading', { level: 1, name: 'Display' }).scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'desktop-display-failed');
    },
  },
];
