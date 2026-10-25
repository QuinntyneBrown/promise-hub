// Screen recordings for video 05, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol, Harbourview programs and events.
const marisol = {
  personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview',
  organizationName: 'Harbourview Youth Collective', plan: 'Standard',
  modules: ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'],
};
const children = [
  { id: 'c-amara', name: 'Amara Okonkwo', age: 7, householdId: 'hh-okonkwo', householdName: 'Okonkwo' },
  { id: 'c-kevin', name: 'Kevin Tran', age: 8, householdId: 'hh-tran', householdName: 'Tran' },
];

function seed() {
  const programs = [
    { id: 'p-tutoring', name: 'After-School Tutoring', startsOn: '2026-09-08', endsOn: '2027-06-24', schedule: 'Mon–Thu, 4–6 pm', capacity: 50, ages: '6–13', enrollmentOpen: true, seasonConsent: true, status: 'Active', roster: ['Mateo Rivera', 'Sofía Rivera', 'Jordan Thompson', 'Yusuf Haddad'] },
    { id: 'p-sports', name: 'Saturday Sports', startsOn: '2026-09-12', endsOn: '2027-05-29', schedule: 'Sat, 10 am–12 pm', capacity: 80, ages: '7–14', enrollmentOpen: true, seasonConsent: true, status: 'Active', roster: ['Kevin Tran', 'Emily Tran'] },
  ];
  const events = [
    { id: 'e-tutoring', programId: 'p-tutoring', name: 'Tutoring night', startsAt: '2026-11-05T21:00:00Z', endsAt: '2026-11-05T23:00:00Z', place: 'Harbourview Community Centre, Room 2', requiresSlip: false, slipStatus: 'NotNeeded' },
    { id: 'e-sports', programId: 'p-sports', name: 'Saturday Sports', startsAt: '2026-11-07T15:00:00Z', endsAt: '2026-11-07T17:00:00Z', place: 'Bennetto School gym', requiresSlip: false, slipStatus: 'NotNeeded' },
    { id: 'e-rbg', programId: 'p-tutoring', name: 'Fall field trip: Royal Botanical Gardens', startsAt: '2026-11-14T14:00:00Z', endsAt: '2026-11-14T20:00:00Z', place: 'Royal Botanical Gardens · bus leaves 8:45 am', requiresSlip: true, slipStatus: 'Draft' },
  ].map((e) => ({ ...e, noShowAlert: true, staffNotes: null, status: 'Scheduled', cancelledAt: null, cancelledBy: null, cancellationMessage: null, guardiansTold: false }));
  return { programs, events };
}

async function fakeApi(demo) {
  const { programs, events } = seed();
  const rosterOf = (p) => p.roster.map((name, i) => ({ id: `r-${p.id}-${i}`, householdId: 'hh', name, age: 9, householdName: name.split(' ')[1] }));
  const summary = (e) => {
    const p = programs.find((x) => x.id === e.programId);
    return { id: e.id, name: e.name, programId: p.id, programName: p.name, startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, rosterSize: p.roster.length, slipStatus: e.slipStatus, status: e.status };
  };
  await demo.page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const body = method === 'GET' ? null : route.request().postDataJSON();
    if (path === '/api/me') return route.fulfill({ json: marisol });
    if (path === '/api/children') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      return route.fulfill({ json: { children: children.filter((c) => c.name.toLowerCase().includes(q)) } });
    }
    if (path === '/api/programs' && method === 'GET') {
      const list = programs.filter((p) => p.status === 'Active');
      return route.fulfill({ json: { programs: list.map((p) => ({ ...p, enrolled: p.roster.length })), active: list.length, archived: 1, enrolled: list.reduce((n, p) => n + p.roster.length, 0) } });
    }
    if (path === '/api/programs') {
      const id = `p-${programs.length + 1}`;
      programs.push({ id, ...body, schedule: body.schedule || null, ages: body.ages || null, status: 'Active', roster: [] });
      return route.fulfill({ status: 201, json: { id } });
    }
    const enroll = path.match(/^\/api\/programs\/([^/]+)\/enrollments$/);
    if (enroll) {
      programs.find((p) => p.id === enroll[1]).roster.push(children.find((c) => c.id === body.childId).name);
      return route.fulfill({ status: 201, json: { id: 'en' } });
    }
    const program = path.match(/^\/api\/programs\/([^/]+)$/);
    if (program) {
      const p = programs.find((x) => x.id === program[1]);
      const { roster, ...rest } = p;
      return route.fulfill({ json: { ...rest, enrolled: roster.length, roster: rosterOf(p), events: events.filter((e) => e.programId === p.id).map((e) => ({ id: e.id, name: e.name, startsAt: e.startsAt, endsAt: e.endsAt, status: e.status })), archivedAt: null, archivedBy: null } });
    }
    if (path === '/api/events') return route.fulfill({ json: { events: events.map(summary), upcoming: events.length, needSlips: events.filter((e) => e.slipStatus === 'Draft').length } });
    const cancel = path.match(/^\/api\/events\/([^/]+)\/cancel$/);
    if (cancel) {
      Object.assign(events.find((e) => e.id === cancel[1]), { status: 'Cancelled', cancelledAt: '2026-11-05T21:12:00Z', cancelledBy: 'Marisol Delgado', cancellationMessage: body.message, guardiansTold: body.tellGuardians });
      return route.fulfill({ status: 204 });
    }
    const ev = path.match(/^\/api\/events\/([^/]+)$/);
    if (ev) {
      const e = events.find((x) => x.id === ev[1]);
      return route.fulfill({ json: { ...e, ...summary(e) } });
    }
    return route.fulfill({ status: 599 });
  });
}

async function open(demo, path) {
  await demo.go(path, { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

export default [
  {
    name: 'programs-desktop',
    run: async (demo) => {
      await fakeApi(demo);
      await open(demo, '/programs');
      demo.mark();
      const app = demo.app();
      await demo.pause(1500);
      await demo.click(app.getByRole('link', { name: 'New program' }));
      await app.getByLabel('Program name').waitFor();
      await demo.type(app.getByLabel('Program name'), 'Spring Robotics');
      await app.getByLabel('Starts').fill('2027-01-10');
      await app.getByLabel('Ends').fill('2027-04-30');
      await demo.type(app.getByLabel('Schedule'), 'Wed, 4–6 pm');
      await demo.type(app.getByLabel('Capacity'), '12');
      await demo.type(app.getByLabel('Ages'), '8–13');
      await demo.click(app.getByRole('button', { name: 'Create program' }));
      await app.getByRole('heading', { name: 'Spring Robotics' }).waitFor();
      await demo.pause(1500);
      await demo.click(app.getByRole('button', { name: 'Add a child' }));
      await demo.type(app.getByRole('dialog').getByLabel('Child’s name'), 'amar');
      await demo.pause(800);
      await demo.click(app.getByRole('button', { name: 'Choose Amara Okonkwo' }));
      await demo.click(app.getByRole('button', { name: 'Add to roster' }));
      await demo.pause(2500);
    },
  },
  {
    name: 'cancel-event-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo);
      await open(demo, '/events');
      demo.mark();
      const app = demo.app();
      await demo.pause(1500);
      await demo.click(app.getByRole('link', { name: /^Fall field trip/ }));
      await app.getByRole('region', { name: 'Permission slip' }).waitFor();
      await demo.pause(1500);
      await demo.click(app.getByRole('button', { name: 'More actions' }));
      await demo.click(app.getByRole('menuitem', { name: 'Cancel event…' }));
      await demo.type(app.getByRole('dialog').getByLabel('Message to guardians'), 'Bus strike: the RBG trip is cancelled. New date soon.');
      await demo.click(app.getByRole('button', { name: 'Cancel event' }));
      await demo.pause(2500);
    },
  },
];
