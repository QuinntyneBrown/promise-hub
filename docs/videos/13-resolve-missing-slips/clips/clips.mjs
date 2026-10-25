// Screen recordings for video 13, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: the field trip's sent slip with two families still to sign.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const people = {
  jaylen: { personName: 'Jaylen Okafor', role: 'SiteLead' },
  marisol: { personName: 'Marisol Delgado', role: 'ProgramDirector' },
};
const trip = { id: 'e-rbg', name: 'Fall field trip: Royal Botanical Gardens', programId: 'p', programName: 'After-School Tutoring', startsAt: '2026-11-14T14:00:00Z', endsAt: '2026-11-14T20:00:00Z', place: 'Royal Botanical Gardens', expected: 4, checkedIn: 0, absent: 0, notYet: 4, status: 'Scheduled' };
const kids = [
  { id: 'c-jordan', name: 'Jordan Thompson', householdId: 'hh-thompson' },
  { id: 'c-mateo', name: 'Mateo Rivera', householdId: 'hh-rivera' },
  { id: 'c-sofia', name: 'Sofía Rivera', householdId: 'hh-rivera' },
  { id: 'c-yusuf', name: 'Yusuf Haddad', householdId: 'hh-haddad' },
];

async function fakeApi(demo, who) {
  const answers = { 'c-mateo': 'Cleared', 'c-jordan': 'Declined' };
  const person = { ...people[who], organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
  const families = () => [
    { householdId: 'hh-haddad', household: 'Haddad', guardian: 'Nour Haddad', children: ['Yusuf'], lastRemindedAt: '2026-11-03T23:00:00Z', reachable: false, reason: 'Email bounced, no mobile' },
    { householdId: 'hh-rivera', household: 'Rivera', guardian: 'Carmen Rivera', children: ['Sofía'], lastRemindedAt: '2026-11-03T23:00:00Z', reachable: true, reason: null },
  ].filter((f) => f.householdId !== 'hh-rivera' || answers['c-sofia'] !== 'Cleared');
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: person });
    if (path === '/api/sessions/today') return route.fulfill({ json: { sessions: [] } });
    if (path === '/api/sessions/e-rbg/roster') {
      return route.fulfill({ json: { session: trip, children: kids.map((k) => ({ id: k.id, childId: k.id, householdId: k.householdId, name: k.name, age: 9, school: 'Bennetto Elementary, Grade 4', medicalFlag: null, status: 'NotYet', checkedInAt: null, walkIn: false, signedOutAt: null, collectedBy: null })) } });
    }
    if (path === '/api/sessions/e-rbg/clearance') {
      const children = kids.map((k) => ({ childId: k.id, householdId: k.householdId, name: k.name, status: answers[k.id] ?? 'Missing' }));
      const order = { Missing: 0, Declined: 1, Cleared: 2 };
      children.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
      return route.fulfill({ json: { slipId: 'slip-rbg', title: trip.name, cleared: children.filter((c) => c.status === 'Cleared').length, missing: children.filter((c) => c.status === 'Missing').length, declined: 1, children } });
    }
    if (path === '/api/events/e-rbg/slip') {
      const responses = kids.map((k) => ({ childId: k.id, child: k.name, household: k.householdId.slice(3), status: answers[k.id] === 'Cleared' ? 'Signed' : answers[k.id] ?? 'Outstanding', signedBy: null }));
      return route.fulfill({ json: { id: 'slip-rbg', eventId: 'e-rbg', eventName: trip.name, eventStartsAt: trip.startsAt, title: trip.name, body: 'We’re taking the After-School Tutoring group to the Royal Botanical Gardens on Saturday 14 November.', signBy: '2026-11-12', askPhotos: true, askSwimming: false, askLunch: true, reminders: 'TwiceWeekly', channel: 'TextAndEmail', status: 'Sent', scheduledFor: null, sentAt: '2026-11-02T14:00:00Z', version: 1, households: 3, children: 4, signed: responses.filter((r) => r.status === 'Signed').length, declined: 1, outstanding: responses.filter((r) => r.status === 'Outstanding').length, responses, delivery: null } });
    }
    if (path === '/api/slips/slip-rbg/unsigned') return route.fulfill({ json: { households: families() } });
    if (path === '/api/slips/slip-rbg/remind') return route.fulfill({ json: { households: 1, unreachable: 1 } });
    if (path === '/api/slips/slip-rbg/sign-on-tablet') {
      answers['c-sofia'] = 'Cleared';
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 599 });
  });
}

export default [
  {
    name: 'bus-door-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, 'jaylen');
      await demo.go('/check-in/e-rbg', { ready: false });
      await demo.app().getByRole('group', { name: 'Permission slips' }).waitFor();
      demo.mark();
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('link', { name: 'Sign on tablet for Sofía Rivera' }));
      await demo.app().getByRole('heading', { name: 'Sign on this tablet' }).waitFor();
      await demo.pause(1500);
      const name = demo.app().getByLabel('Guardian types their full name');
      await name.scrollIntoViewIfNeeded();
      await demo.type(name, 'Carmen Rivera');
      await demo.click(demo.app().getByRole('button', { name: 'Sign', exact: true }));
      await demo.app().getByRole('group', { name: 'Permission slips' }).waitFor();
      await demo.pause(3500);
    },
  },
  {
    name: 'text-unsigned-desktop',
    run: async (demo) => {
      await fakeApi(demo, 'marisol');
      await demo.go('/events/e-rbg/slip', { ready: false });
      await demo.app().getByRole('heading', { name: 'Permission slip' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: /^Text \d+ unsigned$/ }));
      await demo.app().getByRole('dialog').waitFor();
      await demo.pause(3500);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: /^Send to / }));
      await demo.pause(3000);
    },
  },
];
