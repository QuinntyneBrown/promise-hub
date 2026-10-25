// Screen recordings for video 11, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: the field trip's slip and the tutoring families.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
const children = [
  { childId: 'c-jordan', child: 'Jordan Thompson', household: 'Thompson' },
  { childId: 'c-mateo', child: 'Mateo Rivera', household: 'Rivera' },
  { childId: 'c-sofia', child: 'Sofía Rivera', household: 'Rivera' },
  { childId: 'c-yusuf', child: 'Yusuf Haddad', household: 'Haddad' },
];
const intro = 'We’re taking the After-School Tutoring group to the Royal Botanical Gardens on Saturday 14 November. The bus leaves at 8:45 am and returns by 3:00 pm.';

async function fakeApi(demo, { sent = false, answers = {} } = {}) {
  const slip = {
    id: 'slip-rbg', eventId: 'e-rbg', eventName: 'Fall field trip: Royal Botanical Gardens', eventStartsAt: '2026-11-14T14:00:00Z',
    title: 'Fall field trip: Royal Botanical Gardens', body: sent ? intro : '', signBy: sent ? '2026-11-12' : '2026-11-14',
    askPhotos: true, askSwimming: false, askLunch: true, reminders: 'TwiceWeekly', channel: 'TextAndEmail',
    status: sent ? 'Sent' : 'Draft', scheduledFor: null, sentAt: sent ? '2026-11-05T21:12:00Z' : null, version: 1, delivery: null,
  };
  const dto = () => {
    const responses = children.map((c) => ({ ...c, status: answers[c.childId]?.[0] ?? 'Outstanding', signedBy: answers[c.childId]?.[1] ?? null }));
    return { ...slip, households: 3, children: 4, responses, signed: responses.filter((r) => r.status === 'Signed').length, declined: responses.filter((r) => r.status === 'Declined').length, outstanding: responses.filter((r) => r.status === 'Outstanding').length };
  };
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === '/api/me') return route.fulfill({ json: marisol });
    if (path === '/api/events/e-rbg/slip' && method === 'GET') return route.fulfill({ json: dto() });
    if (path === '/api/events/e-rbg/slip' && method === 'PUT') {
      Object.assign(slip, route.request().postDataJSON());
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/slips/slip-rbg/send') {
      Object.assign(slip, { status: 'Sent', sentAt: new Date().toISOString() });
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/slips/slip-rbg' && method === 'PUT') {
      const b = route.request().postDataJSON();
      Object.assign(slip, { title: b.title, body: b.body, signBy: b.signBy });
      if (b.material) {
        slip.version++;
        answers = {};
      }
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 599 });
  });
}

async function open(demo) {
  await demo.go('/events/e-rbg/slip', { ready: false });
  await demo.app().getByRole('heading', { level: 1, name: 'Permission slip' }).waitFor();
  await demo.pause(800);
}

export default [
  {
    name: 'write-and-send-desktop',
    run: async (demo) => {
      await fakeApi(demo);
      await open(demo);
      demo.mark();
      await demo.pause(1200);
      await demo.type(demo.app().getByLabel('What guardians read before signing'), intro);
      await demo.app().getByLabel('Sign by').fill('2026-11-12');
      await demo.pause(1200);
      await demo.app().getByRole('heading', { name: 'Delivery' }).scrollIntoViewIfNeeded();
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Save and send', exact: true }));
      await demo.app().getByRole('progressbar').waitFor();
      await demo.pause(4000);
    },
  },
  {
    name: 'track-and-edit-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { sent: true, answers: { 'c-mateo': ['Signed', 'Carmen Rivera'], 'c-jordan': ['Declined', 'Dana Thompson'] } });
      await open(demo);
      demo.mark();
      await demo.pause(2000);
      await demo.app().getByRole('table', { name: 'Answers by child' }).scrollIntoViewIfNeeded();
      await demo.pause(2500);
      const body = demo.app().getByLabel('What guardians read before signing');
      await body.scrollIntoViewIfNeeded();
      await demo.pause(800);
      await body.fill(`${intro} We will also swim.`);
      await demo.click(demo.app().getByRole('switch', { name: /material/ }));
      await demo.pause(1000);
      await demo.click(demo.app().getByRole('button', { name: 'Save changes', exact: true }));
      await demo.pause(1500);
      await demo.app().getByRole('progressbar').scrollIntoViewIfNeeded();
      await demo.pause(3000);
    },
  },
];
