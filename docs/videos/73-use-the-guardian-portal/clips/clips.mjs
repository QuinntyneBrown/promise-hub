// Screen recordings and screenshots for video 73, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Carmen Rivera opens her household link (no account, the device already
// verified), sees Mateo and Sofía and two new announcements, opens Sofía's read-only page (schedule, consents, attendance,
// Learning progress), reads the announcements and marks them read, on a laptop and a phone; then the Spanish page, Mateo
// without Learning, the empty, failed, expired and Messages off states (L2-102 to L2-104, ADR 0067).
// "Now" is Thu 5 Nov 2026, 4:12 pm in Hamilton.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const NOW = new Date('2026-11-05T21:12:00Z');
const TOKEN = 'tok-home-rivera';
const ORG = 'Harbourview Youth Collective';
const PHONE = '905-555-0100';

const schedule = [
  { eventId: 'e-tutoring-today', name: 'Tutoring night', program: 'After-School Tutoring', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Harbourview Community Centre, Room 2', status: 'Scheduled', today: true },
  { eventId: 'e-rbg', name: 'Fall field trip: Royal Botanical Gardens', program: 'After-School Tutoring', startsAt: '2026-11-14T14:00:00Z', endsAt: '2026-11-14T20:00:00Z', place: 'Royal Botanical Gardens · bus leaves 8:45 am', status: 'Scheduled', today: false },
];
const slip = (status, signedBy = null) => ({ eventId: 'e-rbg', event: 'Fall field trip: Royal Botanical Gardens', startsAt: '2026-11-14T14:00:00Z', signBy: '2026-11-12', status, signedBy, at: signedBy ? '2026-11-03T18:00:00Z' : null });
const recent = [
  { eventId: 'e-tutoring-today', name: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', status: 'Late' },
  { eventId: 'e-tutoring-yesterday', name: 'Tutoring night', startsAt: '2026-11-04T21:00:00Z', status: 'Excused' },
  { eventId: 'e-tutoring-oct29', name: 'Tutoring night', startsAt: '2026-10-29T20:00:00Z', status: 'Present' },
  { eventId: 'e-tutoring-oct28', name: 'Tutoring night', startsAt: '2026-10-28T20:00:00Z', status: 'Present' },
  { eventId: 'e-tutoring-oct22', name: 'Tutoring night', startsAt: '2026-10-22T20:00:00Z', status: 'Present' },
];
const CHILDREN = {
  'c-mateo': {
    name: 'Mateo Rivera', firstName: 'Mateo', programs: ['After-School Tutoring'], schedule,
    consents: { participation: null, slips: [slip('Signed', 'Carmen Rivera')] },
    attendance: { present: 9, late: 0, excused: 1, absent: 1, recent: recent.map((r, i) => ({ ...r, status: i === 1 ? 'Absent' : 'Present' })) },
    learning: null,
  },
  'c-sofia': {
    name: 'Sofía Rivera', firstName: 'Sofía', programs: ['After-School Tutoring'], schedule,
    consents: {
      participation: { status: 'Given', signedBy: 'Carmen Rivera', relationship: 'Parent', signedAt: '2026-11-05T20:41:00Z', reference: 'GC-4F7A2C', withdrawnAt: null, withdrawnBy: null },
      slips: [slip('NotSigned')],
    },
    attendance: { present: 10, late: 1, excused: 1, absent: 0, recent },
    learning: {
      completedLessons: 4, totalLessons: 9,
      modules: [
        { title: 'Knowing Yourself', track: 'Leadership Foundations', done: 2, total: 2 },
        { title: 'Leading by Serving', track: 'Leadership Foundations', done: 2, total: 3 },
        { title: 'Speaking Up', track: 'Leadership Foundations', done: 0, total: 2 },
        { title: 'Web Basics', track: 'Digital Skills', done: 0, total: 2 },
      ],
      badges: [{ name: 'First Steps', icon: 'star' }, { name: 'Speaks Up', icon: 'flag' }],
      badgeCount: 6,
    },
  },
};
const ANNOUNCEMENTS = [
  { id: 'a-room', title: 'Tutoring night moves to Room 2 this Thursday.', body: 'Tutoring night moves to Room 2 this Thursday. The gym floor is being redone; same time, 4:00 pm. Pickup is at the main entrance.', from: 'Marisol Delgado', sentAt: '2026-11-05T14:30:00Z' },
  { id: 'a-trip', title: 'Royal Botanical Gardens trip: slips due Thursday.', body: 'Royal Botanical Gardens trip: slips due Thursday 12 November. Lunch is provided.', from: 'Marisol Delgado', sentAt: '2026-11-02T14:00:00Z' },
  { id: 'a-party', title: 'Halloween party photos are on the board in the lobby.', body: 'Halloween party photos are on the board in the lobby. Thanks to every family who came.', from: 'Priya Raman', sentAt: '2026-10-31T15:00:00Z' },
];

const newState = (x = {}) => ({ language: 'en', read: ['a-party'], announcements: ANNOUNCEMENTS, messages: true, gone: false, failRead: false, ...x });

/** The guardian pages as the real API answers Carmen's household link. */
async function fakeApi(demo, state) {
  await demo.page.clock.setFixedTime(NOW);
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (!path.startsWith(`/api/g/home/`)) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    if (state.gone) return route.fulfill({ status: 410, json: { code: 'link-expired', organization: ORG, phone: PHONE } });
    const base = { language: state.language, organization: ORG, phone: PHONE };
    const unread = () => state.announcements.filter((a) => !state.read.includes(a.id)).length;
    if (path === `/api/g/home/${TOKEN}`) {
      return route.fulfill({
        json: {
          ...base, firstName: 'Carmen', noShows: [], pickupRequests: [],
          contact: { name: 'Carmen Rivera', mobile: '905-555-0142', email: 'carmen.rivera@example.com', language: 'Spanish' },
          announcements: state.messages ? unread() : null,
          children: ['c-mateo', 'c-sofia'].map((id) => ({
            id, name: CHILDREN[id].name, firstName: CHILDREN[id].firstName, programs: CHILDREN[id].programs, allergies: null, medication: null, pickups: [],
            enrollments: [{ program: 'After-School Tutoring', status: 'Enrolled', position: null, note: null, startsOn: '2026-09-08', schedule: 'Mon–Thu, 4–6 pm' }],
          })),
        },
      });
    }
    const child = new RegExp(`^/api/g/home/${TOKEN}/children/([^/]+)$`).exec(path);
    if (child) return CHILDREN[child[1]] ? route.fulfill({ json: { ...base, ...CHILDREN[child[1]] } }) : route.fulfill({ status: 404 });
    if (path === `/api/g/home/${TOKEN}/announcements`) {
      if (!state.messages) return route.fulfill({ status: 404 });
      return route.fulfill({ json: { ...base, unread: unread(), announcements: state.announcements.map((a) => ({ ...a, read: state.read.includes(a.id) })) } });
    }
    if (path === `/api/g/home/${TOKEN}/announcements/read`) {
      if (state.failRead) return route.fulfill({ status: 500 });
      state.read = state.announcements.map((a) => a.id);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { name, level: 1 }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const scrollTo = async (demo, name) => {
  await app(demo).getByRole('heading', { name }).first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  await demo.pause(1600);
};

export default [
  {
    // Carmen opens her family link, sees her children and two new announcements, and opens Sofía: schedule, consents,
    // attendance and Learning progress, read only.
    name: 'child-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go(`/g/home/${TOKEN}`, { ready: false });
      await heading(demo, 'Hi Carmen');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-home');
      await demo.click(app(demo).getByRole('link', { name: /Sofía Rivera/ }));
      await heading(demo, 'Sofía');
      await demo.pause(3000);
      await shot(demo, 'desktop-child');
      await scrollTo(demo, 'Attendance');
      await demo.pause(2200);
      await shot(demo, 'desktop-attendance');
      await scrollTo(demo, 'Learning');
      await demo.pause(2400);
      await shot(demo, 'desktop-learning');
      await scrollTo(demo, 'Badges Sofía has earned');
      await demo.pause(2400);
    },
  },
  {
    // Announcements from the family page: two New, Mark all read, and the family page's count goes.
    name: 'announcements-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go(`/g/home/${TOKEN}`, { ready: false });
      await heading(demo, 'Hi Carmen');
      demo.mark();
      await demo.pause(1600);
      await demo.click(app(demo).getByRole('link', { name: 'Read announcements' }));
      await heading(demo, 'Announcements');
      await demo.pause(3200);
      await shot(demo, 'desktop-announcements');
      await demo.click(app(demo).getByRole('button', { name: 'Mark all read' }));
      await app(demo).getByText('All caught up.').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-all-read');
      await demo.click(app(demo).getByRole('link', { name: 'Back to your family' }));
      await heading(demo, 'Hi Carmen');
      await app(demo).getByText('No new announcements.').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-home-read');
    },
  },
  {
    // On a phone: the family page, Sofía, and the announcements.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go(`/g/home/${TOKEN}`, { ready: false });
      await heading(demo, 'Hi Carmen');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-home');
      await demo.click(app(demo).getByRole('link', { name: /Sofía Rivera/ }));
      await heading(demo, 'Sofía');
      await demo.pause(2200);
      await shot(demo, 'phone-child');
      await scrollTo(demo, 'Learning');
      await demo.pause(2000);
      await shot(demo, 'phone-learning');
      await demo.click(app(demo).getByRole('link', { name: 'Back to your family' }));
      await heading(demo, 'Hi Carmen');
      await demo.click(app(demo).getByRole('link', { name: 'Read announcements' }));
      await heading(demo, 'Announcements');
      await demo.pause(2400);
      await shot(demo, 'phone-announcements');
    },
  },
  {
    // In Spanish, Mateo without Learning, marking read failing, no announcements, Messages off and an expired link.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState({ language: 'es' });
      await fakeApi(demo, state);
      await demo.go(`/g/home/${TOKEN}/children/c-sofia`, { ready: false });
      await heading(demo, 'Sofía');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-spanish');
      state.language = 'en';
      await demo.go(`/g/home/${TOKEN}/children/c-mateo`, { ready: false });
      await heading(demo, 'Mateo');
      await scrollTo(demo, 'Attendance');
      await demo.pause(2000);
      await shot(demo, 'desktop-mateo');
      state.failRead = true;
      await demo.go(`/g/home/${TOKEN}/announcements`, { ready: false });
      await heading(demo, 'Announcements');
      await demo.click(app(demo).getByRole('button', { name: 'Mark all read' }));
      await app(demo).getByText('That didn’t go through').first().waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-mark-failed');
      state.announcements = [];
      await demo.go(`/g/home/${TOKEN}/announcements`, { ready: false });
      await heading(demo, 'Announcements');
      await app(demo).getByText('No announcements yet').first().waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-announcements-empty');
      state.messages = false;
      await demo.go(`/g/home/${TOKEN}/announcements`, { ready: false });
      await heading(demo, 'This page isn’t available');
      await demo.pause(2000);
      await shot(demo, 'desktop-messages-off');
      state.gone = true;
      await demo.go(`/g/home/${TOKEN}/children/c-sofia`, { ready: false });
      await heading(demo, 'This link has expired');
      await demo.pause(2000);
      await shot(demo, 'desktop-expired');
    },
  },
];
