// Screen recordings and screenshots for video 70, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol Delgado (Program director, Harbourview) schedules
// Tutoring night every Thursday for After-School Tutoring and browses the calendar; Sofía Rivera (Youth, After-School
// Tutoring) RSVPs from her schedule; Marisol reads the RSVPs on the event (L2-093, L2-094, ADR 0064). "Now" is Thu 5 Nov 2026, 4:12 pm.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const ON = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const NOW = new Date('2026-11-05T21:12:00Z');
const NOTE = 'Can I bring my inhaler on the bus?';

const PROGRAMS = [
  { id: 'p-tutoring', name: 'After-School Tutoring', schedule: 'Mon–Thu, 4–6 pm', startsOn: '2026-09-08', endsOn: '2027-06-24', enrolled: 4, capacity: 50, enrollmentOpen: true, status: 'Active', term: '2026–27' },
  { id: 'p-sports', name: 'Saturday Sports', schedule: 'Sat, 10 am–12 pm', startsOn: '2026-09-12', endsOn: '2027-05-29', enrolled: 2, capacity: 80, enrollmentOpen: true, status: 'Active', term: '2026–27' },
];

const offsetFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', timeZoneName: 'longOffset' });
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' });
const offset = (d) => {
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(offsetFormat.formatToParts(d).find((p) => p.type === 'timeZoneName').value);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
};
const hamiltonDay = (iso) => dayFormat.format(new Date(iso));
/** Weekly starts at the same Hamilton time through the program's last day, as WeeklySeries plans them. */
function weekly(first, lastDay) {
  const start = new Date(first);
  const out = [];
  for (let w = 0; out.length <= 60; w++) {
    const naive = new Date(start.getTime() + w * 7 * 86_400_000);
    const at = new Date(naive.getTime() + (offset(start) - offset(naive)) * 60_000);
    if (hamiltonDay(at.toISOString()) > lastDay) break;
    out.push(at.toISOString());
  }
  return out;
}

const event = (id, programId, name, startsAt, endsAt, place, extra = {}) => ({
  id, programId, name, startsAt, endsAt, place, requiresSlip: false, noShowAlert: true, staffNotes: null, status: 'Scheduled', slipStatus: 'NotNeeded',
  cancelledAt: null, cancelledBy: null, cancellationMessage: null, guardiansTold: false, seriesId: null, ...extra,
});
const seedEvents = () => [
  event('e-tutoring-yesterday', 'p-tutoring', 'Tutoring night', '2026-11-04T21:00:00Z', '2026-11-04T23:00:00Z', 'Harbourview Community Centre, Room 2'),
  event('e-tutoring-today', 'p-tutoring', 'Tutoring night', '2026-11-05T21:00:00Z', '2026-11-05T23:00:00Z', 'Harbourview Community Centre, Room 2'),
  event('e-sports', 'p-sports', 'Saturday Sports', '2026-11-07T15:00:00Z', '2026-11-07T17:00:00Z', 'Bennetto School gym'),
  event('e-rbg', 'p-tutoring', 'Fall field trip: Royal Botanical Gardens', '2026-11-14T14:00:00Z', '2026-11-14T20:00:00Z', 'Royal Botanical Gardens · bus leaves 8:45 am', { requiresSlip: true, slipStatus: 'Sent' }),
  event('e-sports-21', 'p-sports', 'Saturday Sports', '2026-11-21T15:00:00Z', '2026-11-21T17:00:00Z', 'Bennetto School gym', { status: 'Cancelled', cancelledAt: '2026-11-03T19:14:00Z', cancelledBy: 'Marisol Delgado' }),
];

const ME = {
  marisol: { personName: 'Marisol Delgado', role: 'ProgramDirector', membershipId: 'm-marisol' },
  sofia: { personName: 'Sofía Rivera', role: 'Youth', membershipId: 'm-sofia' },
};

const newState = (x = {}) => ({ who: 'marisol', modules: ON, events: seedEvents(), rsvps: [], failRsvp: false, failSchedule: false, failCalendar: false, consent: true, next: 1, ...x });

/** Adds the weekly Tutoring night series, as Repeat weekly creates it. */
function addWeekly(state, first = '2026-11-12T21:00:00Z') {
  const starts = weekly(first, '2027-06-24');
  const ids = starts.map((s) => {
    const id = `e-weekly-${state.next++}`;
    state.events.push(event(id, 'p-tutoring', 'Tutoring night', s, new Date(new Date(s).getTime() + 2 * 3_600_000).toISOString(), 'Harbourview Community Centre, Room 2', { seriesId: 'series-1' }));
    return id;
  });
  return ids;
}

const program = (id) => PROGRAMS.find((p) => p.id === id);
const summary = (e) => ({ id: e.id, name: e.name, programId: e.programId, programName: program(e.programId).name, startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, rosterSize: program(e.programId).enrolled, slipStatus: e.slipStatus, status: e.status });
const NAMES = { 'c-sofia': 'Sofía Rivera', 'c-nadia': 'Nadia Haddad' };

function rsvps(state, e) {
  const answers = state.rsvps.filter((r) => r.eventId === e.id);
  const signIn = e.programId === 'p-tutoring' ? ['c-sofia', 'c-nadia'] : [];
  return {
    going: answers.filter((a) => a.response === 'Going').length,
    maybe: answers.filter((a) => a.response === 'Maybe').length,
    cantMake: answers.filter((a) => a.response === 'CantMake').length,
    noReply: signIn.filter((c) => !answers.some((a) => a.childId === c)).length,
    responses: [...answers].sort((a, b) => b.answeredAt.localeCompare(a.answeredAt)).map((a) => ({ ...a, childName: NAMES[a.childId] })),
  };
}

/** The Events and schedule APIs as the real ones answer Marisol or Sofía. */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const me = ME[state.who];
    const roster = state.modules.includes('Roster');
    if (path === '/api/me')
      return route.fulfill({ json: { ...me, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: state.modules } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 184, households: 112, slipsDue: null, events: [], tasks: [] } });
    if (path === '/api/learning/onboarding')
      return route.fulfill({ json: { status: 'completed', step: 3, preferredName: 'Sofía', pronouns: 'she/her', lessonReminders: true, mentorMessages: true, announcements: false, program: null } });
    if ((path.startsWith('/api/events') || path.startsWith('/api/programs') || path.startsWith('/api/schedule')) && !roster) return route.fulfill({ status: 404 });
    if (path === '/api/programs') return route.fulfill({ json: { programs: PROGRAMS, active: 2, archived: 1, enrolled: 6 } });
    if (path === '/api/events' && req.method() === 'GET') {
      const now = NOW.toISOString();
      const upcoming = state.events.filter((e) => e.endsAt >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      return route.fulfill({ json: { events: upcoming.slice(0, 12).map(summary), upcoming: upcoming.length, needSlips: 0 } });
    }
    if (path === '/api/events' && req.method() === 'POST') {
      const b = req.postDataJSON();
      if (b.repeatsWeekly && hamiltonDay(b.startsAt) > program(b.programId).endsOn)
        return route.fulfill({ status: 422, json: { errors: { startsAt: 'Start on or before the program’s last day, Thu 24 Jun 2027.' } } });
      const ids = b.repeatsWeekly ? addWeekly(state, b.startsAt) : [];
      return route.fulfill({ status: 201, json: { id: ids[0], count: ids.length } });
    }
    if (path === '/api/events/calendar') {
      if (state.failCalendar) return route.fulfill({ status: 500 });
      const month = url.searchParams.get('month') || '2026-11';
      const programId = url.searchParams.get('programId');
      const events = state.events
        .filter((e) => hamiltonDay(e.startsAt).startsWith(month) && (!programId || e.programId === programId))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.name.localeCompare(b.name))
        .map((e) => ({ id: e.id, name: e.name, programId: e.programId, programName: program(e.programId).name, day: hamiltonDay(e.startsAt), startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, status: e.status }));
      return route.fulfill({ json: { month, today: '2026-11-05', events } });
    }
    const one = /^\/api\/events\/([^/]+)$/.exec(path);
    if (one) {
      const e = state.events.find((x) => x.id === one[1]);
      if (!e) return route.fulfill({ status: 404 });
      const { seriesId, ...rest } = e;
      return route.fulfill({
        json: { ...rest, programName: program(e.programId).name, rosterSize: program(e.programId).enrolled, seriesSize: seriesId ? state.events.filter((x) => x.seriesId === seriesId).length : null, rsvps: rsvps(state, e) },
      });
    }
    if (path === '/api/schedule') {
      if (!state.consent) return route.fulfill({ status: 403, json: { code: 'consent-required', consentAge: 18 } });
      if (state.failSchedule) return route.fulfill({ status: 500 });
      const now = NOW.toISOString();
      const until = new Date(NOW.getTime() + 28 * 86_400_000).toISOString();
      const sessions = state.events
        .filter((e) => e.programId === 'p-tutoring' && e.startsAt > now && e.startsAt <= until)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map((e) => {
          const r = state.rsvps.find((x) => x.eventId === e.id && x.childId === 'c-sofia');
          return { eventId: e.id, name: e.name, programName: program(e.programId).name, day: hamiltonDay(e.startsAt), startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, status: e.status, response: r?.response ?? null, note: r?.note ?? null };
        });
      return route.fulfill({ json: { sessions } });
    }
    const rsvp = /^\/api\/schedule\/([^/]+)\/rsvp$/.exec(path);
    if (rsvp) {
      if (state.failRsvp) return route.fulfill({ status: 500 });
      const e = state.events.find((x) => x.id === rsvp[1]);
      if (e.status !== 'Scheduled') return route.fulfill({ status: 409, json: { code: 'rsvp-closed' } });
      const b = req.postDataJSON();
      const note = b.note?.trim() || null;
      const existing = state.rsvps.find((x) => x.eventId === e.id && x.childId === 'c-sofia');
      if (existing) Object.assign(existing, { response: b.response, note, answeredAt: NOW.toISOString() });
      else state.rsvps.push({ eventId: e.id, childId: 'c-sofia', response: b.response, note, answeredAt: NOW.toISOString() });
      return route.fulfill({ json: { response: b.response, note } });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const rsvpDialog = (demo) => app(demo).getByRole('dialog', { name: 'RSVP' });
const answer = (demo, label) => rsvpDialog(demo).getByRole('radio', { name: new RegExp(`^${label}`) });
const rsvpFor = (demo, day) => app(demo).getByRole('region', { name: day }).getByRole('button', { name: /RSVP/ }).first();

async function fillWeekly(demo, startsAt, endsAt) {
  await demo.type(app(demo).getByLabel('Event name'), 'Tutoring night');
  await app(demo).getByLabel('Program').selectOption({ label: 'After-School Tutoring' });
  await app(demo).getByLabel('Starts').fill(startsAt);
  await app(demo).getByLabel('Ends').fill(endsAt);
  await demo.type(app(demo).getByLabel('Where'), 'Harbourview Community Centre, Room 2');
  await demo.pause(600);
  await demo.click(app(demo).getByRole('switch', { name: 'Repeat weekly' }));
  await demo.pause(1200);
}

export default [
  {
    // Marisol schedules Tutoring night every Thursday from Events › New event, and the first session opens.
    name: 'weekly-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/events', { ready: false });
      await heading(demo, 'Events');
      demo.mark();
      await demo.pause(1600);
      await shot(demo, 'desktop-events');
      await demo.click(app(demo).getByRole('link', { name: 'New event' }));
      await heading(demo, 'New event');
      await fillWeekly(demo, '2026-11-12T16:00', '2026-11-12T18:00');
      await shot(demo, 'desktop-form-weekly');
      await demo.click(button(demo, 'Create event'));
      await heading(demo, 'Tutoring night');
      await demo.pause(2600);
      await shot(demo, 'desktop-event-created');
    },
  },
  {
    // The calendar: November by week, the program filter, the next month and an empty month.
    name: 'calendar-desktop',
    run: async (demo) => {
      const state = newState();
      addWeekly(state);
      await fakeApi(demo, state);
      await demo.go('/events', { ready: false });
      await heading(demo, 'Events');
      demo.mark();
      await demo.click(app(demo).getByRole('link', { name: 'Calendar' }));
      await heading(demo, 'Calendar');
      await demo.pause(3000);
      await shot(demo, 'desktop-calendar');
      await app(demo).getByLabel('Program').selectOption({ label: 'After-School Tutoring' });
      await demo.pause(2400);
      await shot(demo, 'desktop-calendar-filtered');
      await demo.click(button(demo, 'Next month'));
      await demo.pause(2200);
      await app(demo).getByLabel('Program').selectOption({ label: 'All programs' });
      await demo.go('/events/calendar?month=2027-07', { ready: false });
      await heading(demo, 'Calendar');
      await demo.pause(2200);
      await shot(demo, 'desktop-calendar-empty');
    },
  },
  {
    // Sofía's schedule: RSVP Going to the field trip with a note, then change Tutoring night to Maybe.
    name: 'youth-desktop',
    run: async (demo) => {
      const state = newState({ who: 'sofia' });
      addWeekly(state);
      await fakeApi(demo, state);
      await demo.go('/schedule', { ready: false });
      await heading(demo, 'Your schedule');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-schedule');
      await demo.click(rsvpFor(demo, 'Saturday 14 November'));
      await rsvpDialog(demo).waitFor();
      await demo.pause(900);
      await demo.click(answer(demo, 'Yes, I’ll be there'));
      await demo.type(rsvpDialog(demo).getByLabel(/^Note for staff/), NOTE);
      await demo.pause(1000);
      await shot(demo, 'desktop-rsvp');
      await demo.click(button(demo, 'Send RSVP'));
      await app(demo).getByText('RSVP sent').first().waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-sent');
      await demo.click(rsvpFor(demo, 'Thursday 12 November'));
      await rsvpDialog(demo).waitFor();
      await demo.click(answer(demo, 'Maybe'));
      await demo.click(button(demo, 'Send RSVP'));
      await demo.pause(2600);
    },
  },
  {
    // Marisol opens the field trip: the RSVPs card with the counts and each note.
    name: 'rsvps-desktop',
    run: async (demo) => {
      const state = newState();
      state.rsvps.push({ eventId: 'e-rbg', childId: 'c-sofia', response: 'Going', note: NOTE, answeredAt: '2026-11-05T21:10:00Z' });
      state.rsvps.push({ eventId: 'e-rbg', childId: 'c-nadia', response: 'Maybe', note: 'I might have a shift at work.', answeredAt: '2026-11-04T20:00:00Z' });
      await fakeApi(demo, state);
      await demo.go('/events', { ready: false });
      await heading(demo, 'Events');
      demo.mark();
      await demo.click(app(demo).getByRole('link', { name: /^Fall field trip/ }).first());
      await heading(demo, 'Fall field trip: Royal Botanical Gardens');
      await demo.pause(3600);
      await shot(demo, 'desktop-rsvps');
    },
  },
  {
    // On a phone: the calendar as an agenda, then Sofía's schedule and the RSVP sheet.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      addWeekly(state);
      await fakeApi(demo, state);
      await demo.go('/events/calendar', { ready: false });
      await heading(demo, 'Calendar');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'phone-calendar');
      state.who = 'sofia';
      await demo.go('/schedule', { ready: false });
      await heading(demo, 'Your schedule');
      await demo.pause(2000);
      await shot(demo, 'phone-schedule');
      await demo.click(rsvpFor(demo, 'Saturday 14 November'));
      await rsvpDialog(demo).waitFor();
      await demo.click(answer(demo, 'Yes, I’ll be there'));
      await demo.pause(1600);
      await shot(demo, 'phone-rsvp');
      await demo.click(button(demo, 'Send RSVP'));
      await demo.pause(2200);
    },
  },
  {
    // Refused and failed: a series after the last day, an RSVP with no answer, a failed send, a closed session, the
    // schedule failing to load, consent required, the calendar failing, and Roster off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/events/new', { ready: false });
      await heading(demo, 'New event');
      demo.mark();
      await fillWeekly(demo, '2027-07-01T16:00', '2027-07-01T18:00');
      await demo.click(button(demo, 'Create event'));
      await app(demo).getByText('Start on or before the program’s last day, Thu 24 Jun 2027.').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-weekly-invalid');
      state.who = 'sofia';
      addWeekly(state);
      await demo.go('/schedule', { ready: false });
      await heading(demo, 'Your schedule');
      await demo.click(rsvpFor(demo, 'Saturday 14 November'));
      await rsvpDialog(demo).waitFor();
      await demo.click(button(demo, 'Send RSVP'));
      await rsvpDialog(demo).getByText('Choose whether you’re going.').first().waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-rsvp-invalid');
      state.failRsvp = true;
      await demo.click(answer(demo, 'Can’t make it'));
      await demo.click(button(demo, 'Send RSVP'));
      await rsvpDialog(demo).getByText('That didn’t go through').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-rsvp-failed');
      state.failRsvp = false;
      state.events.find((e) => e.id === 'e-rbg').status = 'Cancelled';
      await demo.click(button(demo, 'Send RSVP'));
      await rsvpDialog(demo).getByText('RSVPs are closed for this session').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-rsvp-closed');
      await demo.click(rsvpDialog(demo).getByRole('button', { name: 'Close' }).last());
      await demo.pause(1800);
      await shot(demo, 'desktop-schedule-cancelled');
      state.failSchedule = true;
      await demo.go('/schedule', { ready: false });
      await app(demo).getByText('We couldn’t load your schedule').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-schedule-error');
      state.failSchedule = false;
      state.consent = false;
      await demo.go('/schedule', { ready: false });
      await app(demo).getByText('A guardian needs to agree first').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-consent');
      state.who = 'marisol';
      state.failCalendar = true;
      await demo.go('/events/calendar', { ready: false });
      await app(demo).getByText('We couldn’t load the calendar').waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-calendar-error');
      state.modules = [];
      state.who = 'sofia';
      await demo.go('/schedule', { ready: false });
      await heading(demo, /^Welcome/);
      await demo.pause(2000);
      await shot(demo, 'desktop-roster-off');
    },
  },
];
