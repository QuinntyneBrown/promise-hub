// Screen recordings and screenshots for video 75, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Sofía Rivera (12, youth at Harbourview Youth Collective) reads her
// notifications — a message from her mentor Daniel Osei, Marisol Delgado's announcement, work Daniel assigned, a grade
// and a badge — and a new one arrives without a reload; Daniel and Marisol read theirs; Sofía chooses what reaches her;
// then the phone, and the empty, failed, Messages off and nothing-to-choose states (L2-109 to L2-111, ADR 0069).
// "Now" is Thu 5 Nov 2026, 4:12 pm in Hamilton.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const NOW = new Date('2026-11-05T21:12:00Z');
const ORG = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };

const PEOPLE = {
  'm-marisol': { personName: 'Marisol Delgado', role: 'ProgramDirector' },
  'm-daniel': { personName: 'Daniel Osei', role: 'Mentor' },
  'm-sofia': { personName: 'Sofía Rivera', role: 'Youth' },
  'm-leo': { personName: 'Leo Martins', role: 'Volunteer' },
};

// The kinds, their modules and who receives each, as NotificationKinds answers them.
const KINDS = [
  { key: 'learning', name: 'Grades and badges', hint: 'When your work is graded, a quiz score is approved or you earn a badge.', modules: ['Learning'], roles: ['Youth'] },
  { key: 'assignments', name: 'Assigned work', hint: 'When your mentor assigns you a lesson, quiz or assignment.', modules: ['Learning', 'Mentoring'], roles: ['Youth'] },
  { key: 'messages', name: 'Messages', hint: 'When someone writes to you in a conversation.', modules: ['Messages', 'Mentoring'], roles: ['Youth', 'Mentor'] },
  { key: 'announcements', name: 'Announcements', hint: 'When an announcement for your programs is posted.', modules: ['Messages'], roles: ['Youth', 'Mentor'] },
  { key: 'incidents', name: 'Incidents to review', hint: 'When an incident is reported.', modules: ['Incidents'], roles: ['Admin', 'ProgramDirector'] },
  { key: 'mentoring', name: 'At-risk flags', hint: 'When a mentor flags a youth as at risk.', modules: ['Mentoring'], roles: ['Admin', 'ProgramDirector'] },
  { key: 'requests', name: 'Family data requests', hint: 'When a household asks for a copy or deletion of its data.', modules: ['Roster'], roles: ['Admin', 'ProgramDirector'] },
];

const n = (id, to, kind, text, link, minutesAgo, read = false) => ({
  id, to, kind, text, link, createdAt: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(), readAt: read ? '2026-11-05T12:00:00Z' : null,
});
const NOTICES = () => [
  n('n1', 'm-sofia', 'messages', 'New message from Daniel Osei', '/conversations/m-sofia', 7),
  n('n2', 'm-sofia', 'announcements', 'Marisol Delgado posted an announcement: Tutoring night moves to Room 2', '/announcements', 42),
  n('n3', 'm-sofia', 'assignments', 'Daniel Osei assigned you the Last in Line lesson, due Fri 13 Nov.', '/learning', 177),
  n('n4', 'm-sofia', 'learning', 'Daniel Osei approved Serve someone this week: 9 of 10 points.', '/learning', 1372, true),
  n('n5', 'm-sofia', 'learning', 'You earned the Faithful Five badge.', '/learning', 4332, true),
  n('n6', 'm-daniel', 'messages', 'New message from Sofía Rivera', '/conversations/m-sofia', 14),
  n('n7', 'm-daniel', 'announcements', 'Marisol Delgado posted an announcement: Mentor huddle moved to Thursday 7 pm', '/announcements', 8650, true),
  n('n8', 'm-marisol', 'mentoring', 'Daniel Osei flagged Nadia Haddad as at risk (Medium).', '/mentoring/flags', 95),
  n('n9', 'm-marisol', 'incidents', 'Incident reported by Jaylen Okafor: Jordan Thompson, injury.', '/incidents/inc-1', 300, true),
];

const newState = (me, x = {}) => ({ me, modules: ON, notices: NOTICES(), prefs: new Map(), queue: [], next: 1, failList: false, failSave: false, ...x });

const offered = (state) => KINDS.filter((k) => k.roles.includes(PEOPLE[state.me].role) && k.modules.every((m) => state.modules.includes(m)));

/** Notifications, preferences and the event stream as the real API answers the signed-in member. */
async function fakeApi(demo, state) {
  await demo.page.clock.setFixedTime(NOW);
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const me = state.me;
    if (path === '/api/me') return route.fulfill({ json: { ...PEOPLE[me], membershipId: me, ...ORG, modules: state.modules } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/realtime') {
      const started = Date.now();
      while (!state.queue.length && Date.now() - started < 2000) await new Promise((r) => setTimeout(r, 50));
      const events = state.queue.splice(0);
      try {
        return await route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: `retry: 300\n\n${events.join('')}` });
      } catch {
        return undefined;
      }
    }
    if (path === '/api/notifications') {
      if (state.failList) return route.fulfill({ status: 500 });
      const visible = KINDS.filter((k) => k.modules.every((m) => state.modules.includes(m))).map((k) => k.key);
      const mine = state.notices.filter((x) => x.to === me && visible.includes(x.kind)).sort((a, z) => z.createdAt.localeCompare(a.createdAt));
      return route.fulfill({ json: { unread: mine.filter((x) => !x.readAt).length, items: mine.map(({ to, ...x }) => x) } });
    }
    const read = /^\/api\/notifications\/([^/]+)\/read$/.exec(path);
    if (read) {
      const x = state.notices.find((y) => y.id === read[1]);
      if (x) x.readAt = NOW.toISOString();
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/notifications/read-all') {
      state.notices.filter((x) => x.to === me).forEach((x) => (x.readAt ??= NOW.toISOString()));
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/notifications/preferences' && req.method() === 'GET')
      return route.fulfill({ json: { kinds: offered(state).map((k) => ({ key: k.key, name: k.name, hint: k.hint, inApp: state.prefs.get(k.key) ?? true })) } });
    if (path === '/api/notifications/preferences' && req.method() === 'PUT') {
      if (state.failSave) return route.fulfill({ status: 500 });
      for (const c of req.postDataJSON().kinds) state.prefs.set(c.key, c.inApp);
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/conversations/m-sofia')
      return route.fulfill({ json: { youthId: 'm-sofia', youthName: 'Sofía Rivera', mentorId: 'm-daniel', mentorName: 'Daniel Osei', readOnly: false, canSend: true, blocked: null, messages: [
        { id: 'd1', body: 'Ok! Is it still in Room 2?', from: 'Sofía Rivera', mine: me === 'm-sofia', sentAt: '2026-11-05T20:58:00Z' },
        { id: 'd2', body: 'Yes, Room 2 at 4:00. Bring your reflection too.', from: 'Daniel Osei', mine: me === 'm-daniel', sentAt: '2026-11-05T21:05:00Z' },
      ] } });
    if (path === '/api/conversations') return route.fulfill({ json: { conversations: [] } });
    return route.fulfill({ status: 404 });
  });
}

/** A producer saved a notice: the stream tells the recipient's open app (L2-110). */
function arrive(state, notice) {
  state.notices.push(notice);
  state.queue.push('event: notification\ndata: {}\n\n');
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { name, level: 1 }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

export default [
  {
    // Sofía opens her notification center, a message from Daniel arrives live, and she opens it.
    name: 'center-desktop',
    run: async (demo) => {
      const state = newState('m-sofia');
      state.notices = state.notices.filter((x) => x.id !== 'n1');
      await fakeApi(demo, state);
      await demo.go('/notifications', { ready: false });
      await heading(demo, 'Notifications');
      await app(demo).getByText('2 unread').first().waitFor();
      demo.mark();
      await demo.pause(3200);
      await shot(demo, 'desktop-center');
      arrive(state, n('n1', 'm-sofia', 'messages', 'New message from Daniel Osei', '/conversations/m-sofia', 0));
      await app(demo).getByText('3 unread').first().waitFor();
      await demo.pause(3200);
      await shot(demo, 'desktop-live');
      await demo.click(app(demo).getByRole('link', { name: /New message from Daniel Osei/ }));
      await heading(demo, 'Daniel Osei');
      await demo.pause(2600);
      await shot(demo, 'desktop-opened');
    },
  },
  {
    // Daniel's center, then Marisol's: each sees only their own.
    name: 'others-desktop',
    run: async (demo) => {
      const state = newState('m-daniel');
      await fakeApi(demo, state);
      await demo.go('/notifications', { ready: false });
      await heading(demo, 'Notifications');
      await app(demo).getByText('New message from Sofía Rivera').first().waitFor();
      demo.mark();
      await demo.pause(2800);
      await shot(demo, 'desktop-mentor');
      state.me = 'm-marisol';
      await demo.go('/notifications', { ready: false });
      await heading(demo, 'Notifications');
      await app(demo).getByText(/flagged Nadia Haddad/).first().waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-director');
    },
  },
  {
    // Sofía opens Settings from her center, turns Announcements off and saves.
    name: 'preferences-desktop',
    run: async (demo) => {
      const state = newState('m-sofia');
      await fakeApi(demo, state);
      await demo.go('/notifications', { ready: false });
      await heading(demo, 'Notifications');
      demo.mark();
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('link', { name: 'Settings' }));
      await heading(demo, 'Notifications');
      await app(demo).getByRole('switch', { name: 'Announcements' }).waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-preferences');
      await demo.click(app(demo).getByRole('switch', { name: 'Announcements' }));
      await demo.pause(900);
      await demo.click(app(demo).getByRole('button', { name: 'Save changes' }));
      await app(demo).getByText('Notification preferences saved').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-saved');
      state.me = 'm-daniel';
      await demo.go('/account/notifications', { ready: false });
      await app(demo).getByRole('switch', { name: 'Messages' }).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-mentor-preferences');
    },
  },
  {
    // On a phone: the center, a notice arriving, and the preferences.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState('m-sofia');
      state.notices = state.notices.filter((x) => x.id !== 'n1');
      await fakeApi(demo, state);
      await demo.go('/notifications', { ready: false });
      await heading(demo, 'Notifications');
      demo.mark();
      await demo.pause(2000);
      arrive(state, n('n1', 'm-sofia', 'messages', 'New message from Daniel Osei', '/conversations/m-sofia', 0));
      await app(demo).getByText('3 unread').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'phone-center');
      await demo.go('/account/notifications', { ready: false });
      await app(demo).getByRole('switch', { name: 'Announcements' }).waitFor();
      await demo.pause(2400);
      await shot(demo, 'phone-preferences');
    },
  },
  {
    // The states: all caught up, a failed load, Messages off in the center and the preferences, a failed save, nothing to choose.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-sofia', { notices: [] });
      await fakeApi(demo, state);
      await demo.go('/notifications', { ready: false });
      await app(demo).getByText('You’re all caught up').first().waitFor();
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-empty');
      state.failList = true;
      await demo.go('/notifications', { ready: false });
      await app(demo).getByText('We couldn’t load notifications').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-error');
      state.failList = false;
      state.notices = NOTICES();
      state.modules = ON.filter((m) => m !== 'Messages');
      await demo.go('/notifications', { ready: false });
      await app(demo).getByText(/assigned you the Last in Line lesson/).first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-messages-off');
      await demo.go('/account/notifications', { ready: false });
      await app(demo).getByRole('switch', { name: 'Assigned work' }).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-preferences-off');
      state.failSave = true;
      await demo.click(app(demo).getByRole('switch', { name: 'Assigned work' }));
      await demo.click(app(demo).getByRole('button', { name: 'Save changes' }));
      await app(demo).getByText('That didn’t go through').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-failed');
      state.me = 'm-leo';
      await demo.go('/account/notifications', { ready: false });
      await app(demo).getByText('Nothing to choose yet').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-nothing');
    },
  },
];
