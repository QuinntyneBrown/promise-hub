// Screen recordings for video 34, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Jaylen searches by name, then by phone.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const jaylen = { personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

const results = {
  rivera: {
    children: [
      { id: 'c-mateo', name: 'Mateo Rivera', age: 9, householdId: 'hh-rivera', householdName: 'Rivera' },
      { id: 'c-sofia', name: 'Sofía Rivera', age: 12, householdId: 'hh-rivera', householdName: 'Rivera' },
    ],
    households: [{ id: 'hh-rivera', name: 'Rivera', guardians: 'Carmen Rivera, Luis Rivera', phone: '905-555-0142', language: 'Spanish' }],
    events: [],
  },
  phone: {
    children: [],
    households: [{ id: 'hh-tran', name: 'Tran', guardians: 'Linh Tran', phone: '905-555-0163', language: 'English' }],
    events: [],
  },
};

function searchApi() {
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/me') return route.fulfill({ json: jaylen });
      if (url.pathname === '/api/sessions/today') return route.fulfill({ json: { sessions: [] } });
      if (url.pathname === '/api/today') return route.fulfill({ json: { activeChildren: 6, households: 5, slipsDue: [], comingUp: [], tasks: [] } });
      if (url.pathname === '/api/search') {
        const q = (url.searchParams.get('q') ?? '').toLowerCase();
        if (/\d/.test(q)) return route.fulfill({ json: results.phone });
        if ('rivera'.startsWith(q) || q.startsWith('riv')) return route.fulfill({ json: results.rivera });
        return route.fulfill({ json: { children: [], households: [], events: [] } });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'search-desktop',
    run: async (demo) => {
      await searchApi()(demo);
      await demo.go('/search', { ready: false });
      await demo.app().getByRole('heading', { name: 'Search', level: 1 }).waitFor();
      demo.mark();
      await demo.pause(1500);
      const field = demo.app().getByRole('main').getByRole('searchbox');
      await field.pressSequentially('Rivera', { delay: 120 });
      await demo.app().getByRole('list', { name: 'Children' }).waitFor();
      await demo.pause(4000);
      await field.fill('');
      await field.pressSequentially('555-0163', { delay: 120 });
      await demo.app().getByText('Tran household').waitFor();
      await demo.pause(4000);
    },
  },
];
