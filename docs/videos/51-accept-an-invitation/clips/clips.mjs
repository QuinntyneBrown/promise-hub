// Screen recordings and screenshots for video 51, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: the child record and its youth account, Staff and
// roles with resend, the invitation link with its open, weak-password and expired answers, and the role homes
// (L2-051 to L2-054).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const suite = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const harbourview = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: [...suite, 'Learning', 'Mentoring'] };
const people = {
  tom: { personName: 'Tom Nguyen', role: 'Admin', ...harbourview },
  yusuf: { personName: 'Yusuf Haddad', role: 'Youth', ...harbourview },
  grace: { personName: 'Grace Adeyemi', role: 'Mentor', ...harbourview },
};
const yusufChild = {
  id: 'c-yusuf', name: 'Yusuf Haddad', firstName: 'Yusuf', lastName: 'Haddad', dateOfBirth: '2013-09-04', age: 13,
  school: 'École Pavillon de la jeunesse, Grade 8', householdId: 'hh-haddad', householdName: 'Haddad',
  medical: { allergies: null, medication: 'Methylphenidate at noon', conditions: null, doctor: null, redAlert: false, alertInstruction: null, healthCard: null, updatedAt: '2026-09-07T14:00:00Z', updatedBy: 'Nour Haddad' },
  medicalRestricted: false,
};
const invitations = {
  'inv-yusuf': { email: 'yusuf.haddad@example.com', role: 'Youth', suggestedName: 'Yusuf Haddad', joins: 'yusuf' },
  'inv-grace': { email: 'grace.adeyemi@example.org', role: 'Mentor', suggestedName: null, joins: 'grace' },
};

/** The API as the real one answers it; `state.signedIn` names the session's person. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const invite = path.match(/^\/api\/invitations\/([^/]+)(\/accept|\/request-new)?$/);
    if (invite) {
      const [, token, action] = invite;
      if (token === 'inv-expired') {
        if (action === '/request-new') return route.fulfill({ status: 202 });
        return route.fulfill({ status: 410, json: { reason: 'expired', invitedBy: 'Tom Nguyen', organization: 'Harbourview Youth Collective' } });
      }
      const i = invitations[token];
      if (!action) return route.fulfill({ json: { email: i.email, organization: 'Harbourview Youth Collective', role: i.role, invitedBy: 'Tom Nguyen', suggestedName: i.suggestedName } });
      const { password } = route.request().postDataJSON();
      const local = i.email.split('@')[0];
      if (password.length < 12) return route.fulfill({ status: 422, json: { errors: { password: 'Use at least 12 characters.' } } });
      if (password.toLowerCase().includes(local)) return route.fulfill({ status: 422, json: { errors: { password: 'Don’t use your email in your password.' } } });
      state.signedIn = i.joins;
      return route.fulfill({ json: { status: 'signed-in' } });
    }
    const me = state.signedIn && people[state.signedIn];
    if (!me) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    if (path === '/api/me') return route.fulfill({ json: me });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: state.requested ? 1 : 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/children/c-yusuf') return route.fulfill({ json: yusufChild });
    if (path === '/api/children/c-yusuf/youth-account') {
      return route.fulfill({ json: state.invited ? { status: 'Invited', name: null, email: 'yusuf.haddad@example.com', expiresAt: '2026-11-19T21:12:00Z' } : { status: 'None', name: null, email: null, expiresAt: null } });
    }
    if (path === '/api/children/c-yusuf/youth-invitation' && method === 'POST') {
      const { email } = route.request().postDataJSON();
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return route.fulfill({ status: 422, json: { errors: { email: 'Enter an email like name@example.org.' } } });
      state.invited = true;
      return route.fulfill({ status: 201, json: { id: 'inv-1' } });
    }
    if (path === '/api/staff') {
      const staff = [['Daniel Osei', 'Mentor'], ['Jaylen Okafor', 'SiteLead'], ['Leo Martins', 'Volunteer'], ['Marisol Delgado', 'ProgramDirector'], ['Tom Nguyen', 'Admin']];
      return route.fulfill({
        json: {
          members: staff.map(([name, role], n) => ({ id: `m-${n}`, name, email: `${name.split(' ')[0].toLowerCase()}@harbourview.example`, role, isYou: name === 'Tom Nguyen' })),
          invitations: [
            { id: 'inv-g', email: 'grace.adeyemi@example.org', role: 'Mentor', invitedBy: 'Tom Nguyen', invitedAt: '2026-11-05T21:12:00Z', expiresAt: '2026-11-19T21:12:00Z', status: 'Pending', childName: null, replacementRequested: false },
            state.resent
              ? { id: 'inv-y', email: 'yusuf.haddad@example.com', role: 'Youth', invitedBy: 'Tom Nguyen', invitedAt: '2026-10-21T21:12:00Z', expiresAt: '2026-11-19T21:12:00Z', status: 'Pending', childName: 'Yusuf Haddad', replacementRequested: false }
              : { id: 'inv-y', email: 'yusuf.haddad@example.com', role: 'Youth', invitedBy: 'Tom Nguyen', invitedAt: '2026-10-21T21:12:00Z', expiresAt: '2026-11-04T21:12:00Z', status: 'Expired', childName: 'Yusuf Haddad', replacementRequested: true },
          ],
        },
      });
    }
    if (path === '/api/staff/invitations/inv-y/resend') {
      state.resent = true;
      return route.fulfill({ status: 204 });
    }
    const gate = (module, role, body) => route.fulfill(!me.modules.includes(module) ? { status: 404 } : me.role !== role ? { status: 403 } : { json: body });
    if (path === '/api/learning/me') return gate('Learning', 'Youth', { personName: me.personName, child: { id: 'c-yusuf', firstName: 'Yusuf', lastName: 'Haddad', age: 13 } });
    if (path === '/api/mentoring/youth') return gate('Mentoring', 'Mentor', { youth: [] });
    return route.fulfill({ status: 404 });
  });
}

const heading = (demo, name) => demo.app().getByRole('heading', { level: 1, name }).waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

async function accept(demo, password, button) {
  await demo.type(demo.app().getByLabel('Choose a password'), password);
  await demo.click(demo.app().getByRole('button', { name: button }));
}

export default [
  {
    // Tom invites Yusuf from his child record.
    name: 'invite-youth-desktop',
    run: async (demo) => {
      await fakeApi(demo, { signedIn: 'tom' });
      await demo.go('/families/hh-haddad/children/c-yusuf', { ready: false });
      await demo.app().getByText('No youth account yet').waitFor();
      demo.mark();
      await shot(demo, 'desktop-child-no-account');
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Invite to PromiseHub' }));
      await demo.pause(700);
      await demo.type(demo.app().getByRole('textbox', { name: 'Yusuf’s email' }), 'yusuf.haddad@example.com');
      await demo.click(demo.app().getByRole('button', { name: 'Send invitation' }));
      await demo.app().getByText('Invitation sent').waitFor();
      await demo.pause(1200);
      await shot(demo, 'desktop-child-invited');
      await demo.pause(2200);
    },
  },
  {
    // Yusuf opens the link on his phone, tries a password with his email in it, then joins and lands on Learning.
    name: 'accept-youth-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, {});
      await demo.go('/invite/inv-yusuf', { ready: false });
      await heading(demo, 'Join Harbourview Youth Collective');
      demo.mark();
      await shot(demo, 'phone-accept-youth');
      await demo.pause(1500);
      await accept(demo, 'yusuf.haddad rocks 2026', 'Join and start Learning');
      await demo.app().getByText('Don’t use your email in your password.').waitFor();
      await demo.pause(1200);
      await shot(demo, 'phone-weak-password');
      await demo.app().getByLabel('Choose a password').fill('');
      await accept(demo, 'lanterns over the harbour', 'Join and start Learning');
      await heading(demo, 'Learning');
      await demo.pause(1200);
      await shot(demo, 'phone-learning');
      await demo.pause(2000);
    },
  },
  {
    // Grace, invited as a mentor, joins on a laptop and lands on Mentoring.
    name: 'accept-mentor-desktop',
    run: async (demo) => {
      await fakeApi(demo, {});
      await demo.go('/invite/inv-grace', { ready: false });
      await heading(demo, 'Join Harbourview Youth Collective');
      demo.mark();
      await demo.pause(1200);
      await demo.type(demo.app().getByLabel('Your name'), 'Grace Adeyemi');
      await accept(demo, 'mentoring on thursdays', 'Accept and continue');
      await heading(demo, 'Mentoring');
      await demo.pause(1200);
      await shot(demo, 'desktop-mentoring');
      await demo.pause(2000);
    },
  },
  {
    // Yusuf's link has expired: one button asks Tom for a new one.
    name: 'expired-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, {});
      await demo.go('/invite/inv-expired', { ready: false });
      await heading(demo, 'This invitation has expired');
      demo.mark();
      await shot(demo, 'phone-expired');
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Ask Tom Nguyen for a new link' }));
      await heading(demo, 'We’ve let Tom Nguyen know');
      await demo.pause(1200);
      await shot(demo, 'phone-expired-sent');
      await demo.pause(2000);
    },
  },
  {
    // Tom sees "Asked for a new link" on Staff and roles and resends.
    name: 'resend-desktop',
    run: async (demo) => {
      await fakeApi(demo, { signedIn: 'tom', requested: true });
      await demo.go('/settings/staff', { ready: false });
      await heading(demo, 'Staff and roles');
      demo.mark();
      await demo.app().getByText('Asked for a new link').scrollIntoViewIfNeeded();
      await demo.pause(800);
      await shot(demo, 'desktop-staff-invitations');
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('button', { name: 'Resend invitation to yusuf.haddad@example.com' }));
      await demo.app().getByText('Invitation resent').waitFor();
      await demo.pause(2800);
    },
  },
];
