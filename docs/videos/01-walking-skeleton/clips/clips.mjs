// Screen recordings for video 01, made with tools/video-record/record-clips.mjs against the
// running frontend. Like the e2e suite, the backend is faked: /api/me answers from the seed cast.
const sessions = {
  jaylen: { personName: 'Jaylen Okafor', role: 'SiteLead', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard' },
  priya: { personName: 'Priya Raman', role: 'VolunteerCoordinator', organizationId: 'org-northgate', organizationName: 'Northgate Community Church Kids', plan: 'Free' },
};

async function signIn(demo, who) {
  await demo.page.route('**/api/me', (route) => route.fulfill({ json: sessions[who] }));
}

async function open(demo, path) {
  await demo.go(path, { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

export default [
  {
    name: 'shell-desktop',
    run: async (demo) => {
      await signIn(demo, 'jaylen');
      await open(demo, '/');
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'More' }));
      await demo.pause(2000);
      await demo.press('Escape');
      await demo.click(demo.app().getByRole('link', { name: 'Families' }).first());
      await demo.app().getByRole('heading', { level: 1 }).waitFor();
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('link', { name: 'Go to Today' }));
      await demo.pause(1500);
    },
  },
  {
    name: 'shell-phone',
    phone: true,
    run: async (demo) => {
      await signIn(demo, 'priya');
      await open(demo, '/');
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('navigation', { name: 'Primary, phone' }).getByRole('button', { name: 'More' }));
      await demo.pause(2500);
      await demo.press('Escape');
      await demo.pause(1000);
    },
  },
];
