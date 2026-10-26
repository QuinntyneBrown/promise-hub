// Screen recordings for video 36, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Tom shortens the no-show delay and lowers the cap.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

function settingsApi() {
  let settings = { noShowDelayMinutes: 15, emailSupervisorsOnIncidents: true, smsCap: 2000, smsUsed: 1212 };
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/me') return route.fulfill({ json: tom });
      if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (path === '/api/settings/notifications' && route.request().method() === 'GET') return route.fulfill({ json: settings });
      if (path === '/api/settings/notifications') {
        const b = route.request().postDataJSON();
        const errors = {};
        if (b.noShowDelayMinutes < 5 || b.noShowDelayMinutes > 60) errors.noShowDelayMinutes = 'Choose between 5 and 60 minutes.';
        if (b.smsCap < settings.smsUsed) errors.smsCap = 'Can’t be below 1,212, already used this month.';
        if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
        settings = { ...b, smsUsed: settings.smsUsed };
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'settings-desktop',
    run: async (demo) => {
      await settingsApi()(demo);
      await demo.go('/settings/notifications', { ready: false });
      await demo.app().getByLabel('Minutes after start').waitFor();
      demo.mark();
      await demo.pause(2500);
      await demo.app().getByLabel('Minutes after start').fill('10');
      await demo.pause(800);
      await demo.app().getByLabel('Monthly SMS cap (segments)').fill('1000');
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Save changes' }));
      await demo.app().getByRole('alert').waitFor();
      await demo.pause(3000);
      await demo.app().getByLabel('Monthly SMS cap (segments)').fill('1500');
      await demo.click(demo.app().getByRole('button', { name: 'Save changes' }));
      await demo.app().getByText('Notification settings saved').waitFor();
      await demo.pause(3000);
    },
  },
];
