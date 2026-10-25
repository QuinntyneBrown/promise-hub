// Screen recordings for video 15, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Winter Camp's enrollment link and a new family.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
const winter = { id: 'p-winter', name: 'Winter Camp 2026', startsOn: '2026-12-21', endsOn: '2026-12-23', schedule: '21–23 Dec, 8 am–5 pm', capacity: 60, ages: '6–12', enrollmentOpen: false, seasonConsent: true, status: 'Active', enrolled: 0, roster: [], events: [], archivedAt: null, archivedBy: null, enrollmentUrl: null, pendingReviews: 0, waitlisted: 0 };

async function staffApi(demo) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: marisol });
    if (path === '/api/programs/p-winter') return route.fulfill({ json: winter });
    if (path === '/api/programs/p-winter/enrollment/open') {
      Object.assign(winter, { enrollmentOpen: true, enrollmentUrl: 'http://localhost:4317/g/enroll/winter-camp-2026' });
      return route.fulfill({ json: { url: winter.enrollmentUrl } });
    }
    return route.fulfill({ status: 599 });
  });
}

async function guardianApi(demo) {
  let verified = false;
  let draft = null;
  let submitted = false;
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === '/api/g/enroll/winter-camp-2026') return route.fulfill({ json: { program: 'Winter Camp 2026', organization: 'Harbourview Youth Collective', phone: '905-555-0100', open: true, schedule: winter.schedule, ages: winter.ages, startsOn: winter.startsOn } });
    if (path.endsWith('/code')) return route.fulfill({ status: 202 });
    if (path.endsWith('/verify')) {
      verified = true;
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/draft') && method === 'GET') {
      if (!verified) return route.fulfill({ status: 401, json: { code: 'verification-required' } });
      return route.fulfill({ json: draft ? { returning: false, language: 'en', program: 'Winter Camp 2026', ...draft } : { returning: false, language: 'en', program: 'Winter Camp 2026', household: { guardianName: null, mobile: '905-555-0300', email: null, language: 'English' }, children: [] } });
    }
    if (path.endsWith('/draft')) {
      draft = route.request().postDataJSON();
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/submit')) {
      submitted = true;
      return route.fulfill({ json: { status: 'WaitingReview', position: null, children: 1, program: 'Winter Camp 2026' } });
    }
    return route.fulfill({ status: submitted ? 409 : 599 });
  });
}

export default [
  {
    name: 'open-enrollment-desktop',
    run: async (demo) => {
      await staffApi(demo);
      await demo.go('/programs/p-winter', { ready: false });
      await demo.app().getByRole('heading', { name: 'Winter Camp 2026' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('button', { name: 'Open enrollment' }));
      await demo.pause(1500);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Open enrollment' }));
      await demo.app().getByTestId('enrollment-link').waitFor();
      await demo.pause(3500);
    },
  },
  {
    name: 'new-family-phone',
    phone: true,
    run: async (demo) => {
      await guardianApi(demo);
      await demo.go('/g/enroll/winter-camp-2026', { ready: false });
      await demo.app().getByRole('heading', { name: 'Enroll in Winter Camp 2026' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      await demo.type(demo.app().getByLabel('Your mobile number or email'), '905-555-0300');
      await demo.click(demo.app().getByRole('button', { name: 'Send me a code' }));
      await demo.type(demo.app().getByLabel('Six-digit code'), '482913');
      await demo.click(demo.app().getByRole('button', { name: 'Continue' }));
      await demo.app().getByRole('heading', { name: 'Your household' }).waitFor();
      await demo.pause(800);
      await demo.type(demo.app().getByLabel('Your full name', { exact: true }), 'Ngozi Okafor');
      await demo.click(demo.app().getByRole('button', { name: 'Continue', exact: true }));
      await demo.app().getByRole('heading', { name: 'Your children' }).waitFor();
      const child = demo.app().getByRole('group', { name: 'Child 1' });
      await demo.type(child.getByLabel('First name'), 'Ada');
      await demo.type(child.getByLabel('Last name'), 'Okafor');
      await child.getByLabel('Date of birth').fill('2017-05-01');
      await demo.type(child.getByLabel('Allergies'), 'Shellfish');
      await demo.click(demo.app().getByRole('button', { name: 'Continue', exact: true }));
      await demo.app().getByRole('heading', { name: 'Check and submit' }).waitFor();
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('switch', { name: /season consent/ }));
      await demo.click(demo.app().getByRole('button', { name: 'Submit', exact: true }));
      await demo.app().getByRole('heading', { name: 'Thank you, Ngozi' }).waitFor();
      await demo.pause(3000);
    },
  },
];
