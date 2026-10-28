// Screen recordings and screenshots for video 74, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Marisol Delgado (Program director, Harbourview Youth Collective)
// announces to After-School Tutoring; Sofía Rivera (12, Carmen consented) reads her announcements and one arrives live;
// Daniel Osei, her mentor, reads and answers her messages and her reply arrives without a reload; then the phone, the
// consent block, a failed send, an empty conversation, Marisol's read-only view, a youth worker refused and Messages off
// (L2-105 to L2-108, ADR 0068). "Now" is Thu 5 Nov 2026, 4:12 pm in Hamilton.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const NOW = new Date('2026-11-05T21:12:00Z');
const ORG = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' };

const PEOPLE = {
  'm-marisol': { personName: 'Marisol Delgado', role: 'ProgramDirector' },
  'm-aisha': { personName: 'Aisha Bello', role: 'YouthWorker' },
  'm-daniel': { personName: 'Daniel Osei', role: 'Mentor' },
  'm-sofia': { personName: 'Sofía Rivera', role: 'Youth' },
  'm-nadia': { personName: 'Nadia Haddad', role: 'Youth' },
};
const ROLE = { ProgramDirector: 'Program director', Admin: 'Admin' };

const ann = (id, title, body, program, audience, sendAt, extra = {}) => ({
  id, title, body, program, audience, sendAt, sentBy: 'Marisol Delgado', sentByRole: 'ProgramDirector', recipients: 1, reads: 0, households: 0, ...extra,
});
const ANNOUNCEMENTS = () => [
  ann('a-huddle', 'Mentor huddle moved to Thursday 7 pm', 'This week’s mentor huddle is Thursday at 7 pm in Room 3. We’ll plan the field day.', null, 'Mentors', '2026-10-30T15:00:00Z', { recipients: 2, reads: 2 }),
  ann('a-welcome', 'Welcome to Learning', 'Your lessons, badges and journey are in Learning. Your mentor will check in with you each week.', null, 'Everyone', '2026-10-19T13:00:00Z', { sentBy: 'Tom Nguyen', sentByRole: 'Admin', recipients: 4, reads: 3, households: 9 }),
];
const dm = (id, senderId, body, sentAt) => ({ id, youthId: 'm-sofia', mentorId: 'm-daniel', senderId, body, sentAt });
const THREAD = () => [
  dm('d1', 'm-sofia', 'Hi Daniel, I finished the Pick Up the Towel reflection. Can I lead the group one on Thursday?', '2026-11-04T22:40:00Z'),
  dm('d2', 'm-daniel', 'That’s a great idea. Bring the question you liked most and we’ll start with it.', '2026-11-04T23:02:00Z'),
  dm('d3', 'm-sofia', 'Ok! Is it still in Room 2?', '2026-11-05T20:58:00Z'),
];

const newState = (me, x = {}) => ({
  me, modules: ON, announcements: ANNOUNCEMENTS(), reads: new Set(), messages: THREAD(), unread: new Set(['d3']), consent: true,
  failSend: false, queue: [], next: 1, ...x,
});

const members = (a) => (a.audience === 'Mentors' ? ['m-daniel'] : a.audience === 'Guardians' ? [] : a.audience === 'Everyone' ? ['m-sofia', 'm-daniel'] : ['m-sofia']);

/** Announcements, conversations and the event stream as the real API answers the signed-in member. */
async function fakeApi(demo, state) {
  await demo.page.clock.setFixedTime(NOW);
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const me = state.me;
    const person = PEOPLE[me];
    if (path === '/api/me') return route.fulfill({ json: { ...person, membershipId: me, ...ORG, modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/programs')
      return route.fulfill({ json: { active: 2, archived: 0, enrolled: 6, programs: [
        { id: 'p-tutoring', name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24', enrolled: 4, capacity: 50, enrollmentOpen: true, status: 'Active', term: null },
        { id: 'p-sports', name: 'Saturday Sports', schedule: 'Sat, 10 am–12 pm', startsOn: '2026-09-12', endsOn: '2027-05-29', enrolled: 2, capacity: 80, enrollmentOpen: true, status: 'Active', term: null },
      ] } });
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
    if ((path.startsWith('/api/announcements') || path.startsWith('/api/conversations')) && !state.modules.includes('Messages')) return route.fulfill({ status: 404 });
    if (path === '/api/announcements' && req.method() === 'GET')
      return route.fulfill({ json: { announcements: [...state.announcements].sort((a, z) => z.sendAt.localeCompare(a.sendAt)).map((a) => ({ ...a, status: a.sendAt > NOW.toISOString() ? 'Scheduled' : 'Sent' })) } });
    if (path === '/api/announcements' && req.method() === 'POST') {
      const b = req.postDataJSON();
      const program = b.programId === 'p-tutoring' ? 'After-School Tutoring' : b.programId === 'p-sports' ? 'Saturday Sports' : null;
      state.announcements.push(ann(`a-${state.next++}`, b.title, b.body, program, b.audience, b.sendAt ?? NOW.toISOString(), { households: b.audience === 'Youth' || b.audience === 'Mentors' ? 0 : 3 }));
      return route.fulfill({ status: 201, json: { id: 'a-new' } });
    }
    if (path === '/api/announcements/mine') {
      const items = state.announcements.filter((a) => a.sendAt <= NOW.toISOString() && members(a).includes(me)).sort((a, z) => z.sendAt.localeCompare(a.sendAt))
        .map((a) => ({ id: a.id, title: a.title, body: a.body, from: a.sentBy, fromRole: ROLE[a.sentByRole] ?? a.sentByRole, sentAt: a.sendAt, program: a.program, read: state.reads.has(a.id) }));
      return route.fulfill({ json: { unread: items.filter((i) => !i.read).length, announcements: items } });
    }
    if (path === '/api/announcements/mine/read') {
      state.announcements.forEach((a) => state.reads.add(a.id));
      return route.fulfill({ status: 204 });
    }
    if (path.startsWith('/api/conversations') && !state.modules.includes('Mentoring')) return route.fulfill({ status: 404 });
    if (person.role === 'YouthWorker' && path.startsWith('/api/conversations')) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
    const supervisor = person.role === 'ProgramDirector';
    const blocked = state.consent ? null : 'consent';
    const view = (d) => ({ id: d.id, body: d.body, from: PEOPLE[d.senderId].personName, mine: d.senderId === me, sentAt: d.sentAt });
    if (path === '/api/conversations') {
      const last = state.messages[state.messages.length - 1];
      const sofia = { youthId: 'm-sofia', youthName: 'Sofía Rivera', mentorId: 'm-daniel', mentorName: 'Daniel Osei', lastMessage: last?.body ?? null, lastMessageMine: last?.senderId === me,
        lastMessageAt: last?.sentAt ?? null, unread: supervisor ? 0 : state.messages.filter((d) => d.senderId !== me && state.unread.has(d.id)).length, blocked };
      const nadia = { youthId: 'm-nadia', youthName: 'Nadia Haddad', mentorId: 'm-daniel', mentorName: 'Daniel Osei', lastMessage: null, lastMessageMine: false, lastMessageAt: null, unread: 0, blocked: null };
      const rows = me === 'm-daniel' ? [sofia, nadia] : [sofia];
      return route.fulfill({ json: { conversations: rows } });
    }
    const c = /^\/api\/conversations\/([^/]+)(\/messages)?$/.exec(path);
    if (c) {
      const messages = c[1] === 'm-sofia' ? state.messages : [];
      if (c[2]) {
        if (blocked) return route.fulfill({ status: 409, json: { code: 'blocked', blocked } });
        if (state.failSend) return route.fulfill({ status: 500 });
        const d = { id: `d-${state.next++}`, youthId: c[1], mentorId: 'm-daniel', senderId: me, body: req.postDataJSON().body, sentAt: new Date(NOW.getTime() + state.next * 60_000).toISOString() };
        if (c[1] === 'm-sofia') state.messages.push(d);
        return route.fulfill({ status: 201, json: view(d) });
      }
      messages.forEach((d) => d.senderId !== me && !supervisor && state.unread.delete(d.id));
      const youth = c[1] === 'm-sofia' ? 'Sofía Rivera' : 'Nadia Haddad';
      return route.fulfill({ json: { youthId: c[1], youthName: youth, mentorId: 'm-daniel', mentorName: 'Daniel Osei', readOnly: supervisor, canSend: !supervisor && !blocked, blocked: c[1] === 'm-sofia' ? blocked : null, messages: messages.map(view) } });
    }
    return route.fulfill({ status: 404 });
  });
}

/** The other side writes, and the stream tells the open page (L2-107). */
function writeAs(state, senderId, body) {
  state.messages.push({ id: `d-${state.next++}`, youthId: 'm-sofia', mentorId: 'm-daniel', senderId, body, sentAt: new Date(NOW.getTime() + state.next * 60_000).toISOString() });
  state.queue.push(`event: conversation\ndata: {"youthId":"m-sofia"}\n\n`);
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { name, level: 1 }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const dialog = (demo) => app(demo).getByRole('dialog');

export default [
  {
    // Marisol opens Announcements from Messages and sends Room 2 to After-School Tutoring youth and guardians.
    name: 'announce-desktop',
    run: async (demo) => {
      const state = newState('m-marisol');
      await fakeApi(demo, state);
      await demo.go('/messages/announcements', { ready: false });
      await heading(demo, 'Announcements');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-announcements');
      await demo.click(app(demo).getByRole('button', { name: 'New announcement' }).first());
      await dialog(demo).waitFor();
      await demo.pause(900);
      await demo.type(dialog(demo).getByLabel('Title', { exact: true }), 'Tutoring night moves to Room 2');
      await demo.type(dialog(demo).getByLabel('Message', { exact: true }), 'Tutoring night is in Room 2 this Thursday while the gym floor is redone. Same time, 4:00 pm.');
      await dialog(demo).getByLabel('Program', { exact: true }).selectOption({ label: 'After-School Tutoring' });
      await demo.pause(700);
      await demo.click(dialog(demo).getByRole('radio', { name: /^Youth and guardians/ }));
      await demo.pause(1200);
      await shot(demo, 'desktop-compose');
      await demo.click(dialog(demo).getByRole('button', { name: 'Send', exact: true }));
      await app(demo).getByText('Announcement sent').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-announced');
    },
  },
  {
    // Sofía reads her announcements, marks them read, and a new one arrives while the page is open.
    name: 'youth-announcements-desktop',
    run: async (demo) => {
      const state = newState('m-sofia');
      state.announcements.push(ann('a-room', 'Tutoring night moves to Room 2', 'Tutoring night is in Room 2 this Thursday while the gym floor is redone. Same time, 4:00 pm.', 'After-School Tutoring', 'Youth', '2026-11-05T19:00:00Z'));
      await fakeApi(demo, state);
      await demo.go('/announcements', { ready: false });
      await heading(demo, 'Announcements');
      await app(demo).getByText('New', { exact: true }).first().waitFor();
      demo.mark();
      await demo.pause(2800);
      await shot(demo, 'desktop-youth-announcements');
      await demo.click(app(demo).getByRole('button', { name: 'Mark all read' }));
      await app(demo).getByText('All caught up').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-youth-read');
      state.announcements.push(ann('a-trip', 'Royal Botanical Gardens trip: sign-ups close Friday', 'Sign up for the trip on Sat 14 Nov by Friday. Your permission slip comes by text.', null, 'YouthAndGuardians', '2026-11-05T21:12:00.000Z'));
      state.queue.push('event: announcement\ndata: {}\n\n');
      await app(demo).getByText('Royal Botanical Gardens trip: sign-ups close Friday').first().waitFor();
      await demo.pause(2800);
      await shot(demo, 'desktop-youth-live');
    },
  },
  {
    // Daniel opens Messages, reads Sofía's conversation, answers, and her reply arrives without a reload.
    name: 'conversation-desktop',
    run: async (demo) => {
      const state = newState('m-daniel');
      await fakeApi(demo, state);
      await demo.go('/conversations', { ready: false });
      await heading(demo, 'Messages');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-conversations');
      await demo.click(app(demo).getByRole('link', { name: /Sofía Rivera/ }));
      await heading(demo, 'Sofía Rivera');
      await demo.pause(2400);
      await shot(demo, 'desktop-conversation');
      await demo.type(app(demo).getByLabel('Message', { exact: true }), 'Yes, Room 2 at 4:00. See you there.');
      await demo.click(app(demo).getByRole('button', { name: 'Send', exact: true }));
      await app(demo).getByText('Yes, Room 2 at 4:00. See you there.').first().waitFor();
      await demo.pause(2400);
      writeAs(state, 'm-sofia', 'Can I bring my friend Grace next time?');
      await app(demo).getByText('Can I bring my friend Grace next time?').first().waitFor();
      await demo.pause(3000);
      await shot(demo, 'desktop-received');
    },
  },
  {
    // On a phone, Sofía opens Messages from the tab bar, reads Daniel's answer and replies, then her announcements.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState('m-sofia');
      state.messages.push(dm('d4', 'm-daniel', 'Yes, Room 2 at 4:00. See you there.', '2026-11-05T21:05:00Z'));
      state.unread = new Set(['d4']);
      state.announcements.push(ann('a-room', 'Tutoring night moves to Room 2', 'Tutoring night is in Room 2 this Thursday while the gym floor is redone. Same time, 4:00 pm.', 'After-School Tutoring', 'Youth', '2026-11-05T19:00:00Z'));
      await fakeApi(demo, state);
      await demo.go('/', { ready: false });
      await app(demo).getByRole('heading', { name: 'Welcome, Sofía' }).first().waitFor();
      demo.mark();
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('navigation', { name: /phone/ }).getByRole('link', { name: 'Messages' }));
      await heading(demo, 'Messages');
      await demo.pause(2000);
      await shot(demo, 'phone-conversations');
      await demo.click(app(demo).getByRole('link', { name: /Daniel Osei/ }));
      await heading(demo, 'Daniel Osei');
      await demo.pause(1600);
      await demo.type(app(demo).getByLabel('Message', { exact: true }), 'See you!');
      await demo.click(app(demo).getByRole('button', { name: 'Send', exact: true }));
      await app(demo).getByText('See you!').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-conversation');
      await demo.go('/announcements', { ready: false });
      await heading(demo, 'Announcements');
      await demo.pause(2200);
      await shot(demo, 'phone-announcements');
    },
  },
  {
    // The safeguards and states: no consent yet, a failed send, an empty conversation, Marisol reading for safeguarding,
    // a youth worker refused, and Messages off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-daniel', { consent: false, messages: [], unread: new Set() });
      await fakeApi(demo, state);
      await demo.go('/conversations/m-sofia', { ready: false });
      await heading(demo, 'Sofía Rivera');
      await app(demo).getByText('Waiting for a guardian’s consent').first().waitFor();
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-blocked');
      state.consent = true;
      state.messages = THREAD();
      state.failSend = true;
      await demo.go('/conversations/m-sofia', { ready: false });
      await heading(demo, 'Sofía Rivera');
      await demo.type(app(demo).getByLabel('Message', { exact: true }), 'Of course, tell her to come at 4.');
      await demo.click(app(demo).getByRole('button', { name: 'Send', exact: true }));
      await app(demo).getByText('Not sent.').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-failed');
      await demo.go('/conversations/m-nadia', { ready: false });
      await heading(demo, 'Nadia Haddad');
      await demo.pause(2000);
      await shot(demo, 'desktop-empty');
      state.me = 'm-marisol';
      await demo.go('/conversations/m-sofia', { ready: false });
      await heading(demo, 'Sofía Rivera and Daniel Osei');
      await demo.pause(2600);
      await shot(demo, 'desktop-supervisor');
      state.me = 'm-aisha';
      await demo.go('/conversations', { ready: false });
      await app(demo).getByText('Direct messages are for mentors and youth').first().waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-forbidden');
      state.me = 'm-daniel';
      state.modules = ON.filter((m) => m !== 'Messages');
      await demo.go('/conversations', { ready: false });
      await app(demo).getByRole('heading', { name: 'Welcome, Daniel' }).first().waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-messages-off');
    },
  },
];
