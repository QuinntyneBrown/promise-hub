// Screen recordings for video 43, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Carmen asks for a copy, then Tom sends it.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

const home = {
  language: 'es', organization: 'Harbourview Youth Collective', phone: '905-555-0100', firstName: 'Carmen',
  contact: { name: 'Carmen Rivera', mobile: '905-555-0142', email: 'carmen.rivera@example.com', language: 'Spanish' },
  children: [], noShows: [], pickupRequests: [],
};

function guardianApi() {
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/g/home/tok-home-rivera') return route.fulfill({ json: home });
      if (path === '/api/g/home/tok-home-rivera/data-requests') return route.fulfill({ status: 201, json: { id: 'dr-1' } });
      return route.fulfill({ status: 599 });
    });
  };
}

function staffApi() {
  let done = false;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: tom });
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 1, items: [] } });
      if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
      if (path === '/api/settings/privacy') return route.fulfill({ json: { region: 'Canada (Toronto region)', consentRetentionYears: 7 } });
      if (path === '/api/settings/data-requests') {
        return route.fulfill({ json: { requests: [{ id: 'dr-1', household: 'Rivera', kind: 'Export', email: 'carmen.rivera@example.com', requestedAt: '2026-11-05T21:00:00Z', status: done ? 'Fulfilled' : 'Open', fulfilledBy: done ? 'Tom Nguyen' : null }] } });
      }
      if (path === '/api/settings/data-requests/dr-1/fulfil') {
        done = true;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'request-phone',
    phone: true,
    run: async (demo) => {
      await guardianApi()(demo);
      await demo.go('/g/home/tok-home-rivera', { ready: false });
      await demo.app().getByRole('button', { name: 'Preguntar por sus datos' }).waitFor();
      demo.mark();
      await demo.app().getByRole('button', { name: 'Preguntar por sus datos' }).scrollIntoViewIfNeeded();
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('button', { name: 'Preguntar por sus datos' }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Enviar solicitud' }));
      await demo.app().getByText('Solicitud recibida').waitFor();
      await demo.pause(3000);
    },
  },
  {
    name: 'fulfil-desktop',
    run: async (demo) => {
      await staffApi()(demo);
      await demo.go('/settings/privacy', { ready: false });
      await demo.app().getByRole('list', { name: 'Requests from guardians' }).waitFor();
      demo.mark();
      await demo.app().getByRole('list', { name: 'Requests from guardians' }).scrollIntoViewIfNeeded();
      await demo.pause(2500);
      await demo.click(demo.app().getByRole('button', { name: 'Send the copy to Rivera' }));
      await demo.app().getByText('Copy sent to carmen.rivera@example.com').waitFor();
      await demo.pause(3500);
    },
  },
];
