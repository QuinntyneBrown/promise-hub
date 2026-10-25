// Screen recordings for video 10, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Harbourview's programs, households and the SMS cap.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
const org = 'Harbourview Youth Collective';
const programs = [
  { id: 'p-tutoring', name: 'After-School Tutoring', households: ['Rivera', 'Thompson', 'Haddad'] },
  { id: 'p-sports', name: 'Saturday Sports', households: ['Tran'] },
];
const households = {
  Rivera: { guardian: 'Carmen Rivera', language: 'Spanish', mobile: true, email: true },
  Thompson: { guardian: 'Dana Thompson', language: 'English', mobile: true, email: true },
  Haddad: { guardian: 'Nour Haddad', language: 'French', mobile: true, email: true },
  Tran: { guardian: 'Linh Tran', language: 'English', mobile: true, email: false },
};

function segmentsOf(text) {
  return text.length <= 160 ? 1 : Math.ceil(text.length / 153);
}

async function fakeApi(demo, { used = 1212 } = {}) {
  const cap = 2000;
  const messages = [];
  const audienceOf = (b) => {
    const program = programs.find((p) => p.id === b.programId) ?? programs[0];
    return program.households.filter((h) => !b.language || households[h].language === b.language).map((h) => ({ name: h, ...households[h] }));
  };
  await demo.page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (path === '/api/me') return route.fulfill({ json: marisol });
    if (path === '/api/programs') return route.fulfill({ json: { programs: programs.map((p) => ({ id: p.id, name: p.name })) } });
    if (path === '/api/events') return route.fulfill({ json: { events: [] } });
    if (path === '/api/messaging/sms-cap') return route.fulfill({ json: { cap, used, remaining: cap - used, state: used >= cap ? 'Reached' : 'Ok', period: '2026-11' } });
    if (path === '/api/messages/preview') {
      const b = route.request().postDataJSON();
      const list = audienceOf(b);
      const text = `${org}: ${b.body.trim()}`;
      const segments = segmentsOf(text);
      const texts = b.channel === 'EmailOnly' ? [] : list.filter((h) => h.mobile);
      const reachable = b.channel === 'EmailOnly' ? list.filter((h) => h.email) : list;
      return route.fulfill({ json: { recipientCount: list.length, textCount: texts.length, emailCount: reachable.length - texts.length, unreachableCount: list.length - reachable.length, characters: text.length, segments, totalSegments: texts.length * segments, remainingSegments: cap - used, fallingBackToEmail: 0 } });
    }
    if (path === '/api/messages' && method === 'POST') {
      const b = route.request().postDataJSON();
      const body = b.body.trim();
      const id = `msg-${messages.length + 1}`;
      const deliveries = audienceOf(b).map((h) => {
        const email = b.channel === 'EmailOnly' || used >= cap;
        const failed = email && !h.email;
        return { household: h.name, guardian: h.guardian, channel: email ? 'Email' : 'Sms', language: h.language, status: failed ? 'Failed' : 'Sent', reason: failed ? 'No email address' : null, at: failed ? null : new Date().toISOString() };
      });
      messages.unshift({ id, title: body.split('.')[0] + '.', body, deliveries, channel: b.channel, audience: programs.find((p) => p.id === b.programId)?.name ?? 'All programs' });
      return route.fulfill({ status: 201, json: { id } });
    }
    if (path === '/api/messages') {
      return route.fulfill({ json: { segmentsUsed: used, segmentCap: cap, messages: messages.map((m) => ({ id: m.id, title: m.title, sentAt: new Date().toISOString(), sentBy: 'Marisol Delgado', recipientCount: m.deliveries.length, audience: m.audience, channel: m.channel, status: 'Sent', deliveredCount: m.deliveries.filter((d) => d.status === 'Sent').length, failedCount: m.deliveries.filter((d) => d.status === 'Failed').length, pausedCount: 0 })) } });
    }
    if (path.startsWith('/api/messages/')) {
      const m = messages.find((x) => x.id === path.split('/').pop());
      const smsText = `${org}: ${m.body}`;
      const failed = m.deliveries.filter((d) => d.status === 'Failed').length;
      return route.fulfill({ json: { id: m.id, title: m.title, body: m.body, smsText, characters: smsText.length, segments: segmentsOf(smsText), sentAt: new Date().toISOString(), sentBy: 'Marisol Delgado', audience: m.audience, channel: m.channel, status: 'Sent', recipientCount: m.deliveries.length, deliveredCount: m.deliveries.length - failed, failedCount: failed, pausedCount: 0, languages: [...new Set(m.deliveries.map((d) => d.language))].sort(), deliveries: [...m.deliveries].sort((a, b) => (a.status === 'Failed' ? -1 : b.status === 'Failed' ? 1 : a.household.localeCompare(b.household))) } });
    }
    return route.fulfill({ status: 599 });
  });
}

async function compose(demo) {
  await demo.go('/messages/new', { ready: false });
  await demo.app().getByRole('heading', { level: 1, name: 'New message' }).waitFor();
  await demo.pause(800);
}

export default [
  {
    name: 'compose-and-send-desktop',
    run: async (demo) => {
      await fakeApi(demo);
      await compose(demo);
      demo.mark();
      await demo.pause(1200);
      await demo.type(demo.app().getByLabel('Message', { exact: true }), 'Reminder: RBG trip is Sat 14 Nov. Bus leaves 8:45 am sharp. Pack a nut-free lunch.');
      await demo.pause(1500);
      await demo.app().getByLabel('Language').selectOption({ label: 'Spanish' });
      await demo.pause(1800);
      await demo.app().getByLabel('Language').selectOption({ label: 'All languages' });
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: /^Send to 3 guardians/ }));
      await demo.app().getByRole('table', { name: 'Delivery by household' }).waitFor();
      await demo.pause(4000);
    },
  },
  {
    name: 'email-failure-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { used: 2000 });
      await compose(demo);
      demo.mark();
      await demo.pause(2500);
      await demo.app().getByLabel('Send to').selectOption({ label: 'Saturday Sports' });
      await demo.type(demo.app().getByLabel('Message', { exact: true }), 'The gym is closed this Saturday.');
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: /^Send to 1 guardian/ }));
      await demo.app().getByRole('table', { name: 'Delivery by household' }).waitFor();
      await demo.pause(3500);
    },
  },
];
