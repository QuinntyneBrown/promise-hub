// Screen recordings and screenshots for video 81, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: a visitor (Dana Thompson, a parent) opens Harbourview Youth
// Collective's public website without signing in, reads the home page, the programs and open cohorts with the learning
// track and mentorship, applies, writes from the contact page, offers to volunteer (Leo Martins) and starts a monthly
// donation; the same pages on a phone; then Northgate with Learning and Mentoring off, nothing open, a failed load and an
// address that is not published (L2-132 to L2-134, ADR 0075).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const SITES = {
  harbourview: {
    name: 'Harbourview Youth Collective',
    city: 'Hamilton, Ontario',
    tagline: 'Tutoring, sports and mentoring for Hamilton kids, after school and on Saturdays.',
    about:
      'Harbourview Youth Collective runs free after-school tutoring, Saturday sports and one-to-one mentoring for children and youth in Hamilton’s north end. Families sign up once and hear from us in their own language.',
    email: 'hello@harbourview.example',
  },
  northgate: {
    name: 'Northgate Community Church Kids',
    city: 'Burlington, Ontario',
    tagline: 'A Wednesday kids club with games, snacks and homework help.',
    about: null,
    email: null,
  },
};

const program = (name, schedule, ages, startsOn, endsOn, status, applyPath, track = null, leadMentor = null) => ({
  name, schedule, ages, startsOn, endsOn, status, applyPath, track, leadMentor,
});
const HARBOURVIEW = {
  programs: [
    program('After-School Tutoring', 'Mon–Thu, 4–6 pm', '6–13', '2026-09-08', '2027-06-24', 'Running', '/g/enroll/after-school-tutoring', 'Leadership Foundations', 'Daniel'),
    program('Saturday Sports', 'Sat, 10 am–12 pm', '7–14', '2026-09-12', '2027-05-29', 'Running', '/g/enroll/saturday-sports', 'Leadership Foundations', 'Hana'),
    program('Winter Camp 2026', '21–23 Dec, 8 am–5 pm', '6–12', '2026-12-21', '2026-12-23', 'Upcoming', null),
  ],
  tracks: [
    {
      name: 'Leadership Foundations',
      description: 'Growing as a leader at home, at school and in the cohort.',
      modules: [
        { title: 'Knowing Yourself', description: 'Strengths, values and the people around you.', badge: null },
        { title: 'Leading by Serving', description: 'Leading isn’t a title.', badge: 'Servant Heart' },
      ],
    },
  ],
  mentorship: true,
  impact: { programs: 3, open: 2, tracks: 1, modules: 2 },
};
const NORTHGATE = {
  programs: [program('Kids Club', 'Wed, 6–7:30 pm', '5–11', '2026-09-09', '2027-06-16', 'Running', '/g/enroll/kids-club')],
  tracks: [],
  mentorship: false,
  impact: { programs: 1, open: 1, tracks: null, modules: null },
};
const NOTHING_OPEN = { ...HARBOURVIEW, programs: HARBOURVIEW.programs.map((p) => ({ ...p, applyPath: null })), impact: { ...HARBOURVIEW.impact, open: 0 } };

const newState = (x = {}) => ({ published: ['harbourview', 'northgate'], content: { harbourview: HARBOURVIEW, northgate: NORTHGATE }, fail: null, ...x });

/** The public website endpoints as the real API answers them (PublicSiteResolver, PublicContentHandler, WebsiteRequestsHandler). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (state.fail && path === state.fail) return route.fulfill({ status: 500 });
    if (path === '/api/me') return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    const m = /^\/api\/website\/([^/]+)(\/[a-z]+)?$/.exec(path);
    if (m) {
      const slug = m[1];
      if (!state.published.includes(slug)) return route.fulfill({ status: 404 });
      if (!m[2]) return route.fulfill({ json: SITES[slug] });
      if (m[2] === '/content') return route.fulfill({ json: state.content[slug] });
      const body = req.postDataJSON() ?? {};
      if (m[2] === '/contact') {
        if (!body.name?.trim() || !body.message?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email ?? ''))
          return route.fulfill({
            status: 422,
            json: {
              errors: {
                ...(body.name?.trim() ? {} : { name: 'Enter your name.' }),
                ...(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email ?? '') ? {} : { email: 'Enter an email like name@example.com.' }),
                ...(body.message?.trim() ? {} : { message: 'Write your message.' }),
              },
            },
          });
        return route.fulfill({ status: 204 });
      }
      if (m[2] === '/volunteer') {
        if (!body.screeningAcknowledged)
          return route.fulfill({ status: 422, json: { errors: { screeningAcknowledged: 'Tick the box to say you understand volunteers are screened.' } } });
        return route.fulfill({ status: 204 });
      }
      if (m[2] === '/donations') return route.fulfill({ json: { checkoutUrl: 'https://checkout.example/pay/chk_001' } });
    }
    if (path === '/api/g/enroll/after-school-tutoring')
      return route.fulfill({
        json: { program: 'After-School Tutoring', organization: 'Harbourview Youth Collective', phone: '905-555-0100', open: true, schedule: 'Mon–Thu, 4–6 pm', ages: '6–13', startsOn: '2026-09-08' },
      });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const region = (demo, name) => app(demo).getByRole('region', { name });
const nav = (demo, name) => app(demo).getByRole('navigation', { name: 'Site' }).getByRole('link', { name, exact: true });

export default [
  {
    // Dana opens Harbourview's address: the home page, its four steps, what it runs and what is open.
    name: 'landing-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/site/harbourview', { ready: false });
      await heading(demo, 'Harbourview Youth Collective');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-landing');
      await region(demo, 'From first visit to first day').scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await region(demo, 'What we run').scrollIntoViewIfNeeded();
      await demo.pause(2000);
      await region(demo, 'Programs taking applications').scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'desktop-open-now');
    },
  },
  {
    // Programs and open cohorts, the learning track with its badge, mentorship, then Apply opens the enrollment link.
    name: 'programs-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/site/harbourview', { ready: false });
      await heading(demo, 'Harbourview Youth Collective');
      demo.mark();
      await demo.pause(1200);
      await demo.click(nav(demo, 'Programs'));
      await heading(demo, 'Programs and open cohorts');
      await demo.pause(2600);
      await shot(demo, 'desktop-programs');
      await region(demo, 'Learning tracks').scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'desktop-tracks');
      await region(demo, 'You’re never on your own').scrollIntoViewIfNeeded();
      await demo.pause(2000);
      await region(demo, 'Cohorts you can join').scrollIntoViewIfNeeded();
      await demo.pause(1200);
      await demo.click(app(demo).getByRole('link', { name: 'Apply to After-School Tutoring' }));
      await app(demo).getByText('After-School Tutoring').first().waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-apply');
    },
  },
  {
    // About, then the contact page: errors inline, then Dana's question sent.
    name: 'contact-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/site/harbourview/about', { ready: false });
      await heading(demo, 'About Harbourview Youth Collective');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-about');
      await demo.click(nav(demo, 'Contact'));
      await heading(demo, 'Get in touch');
      await demo.pause(1400);
      await demo.click(app(demo).getByRole('button', { name: 'Send message' }));
      await app(demo).getByText('Fix these to continue').waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-contact-invalid');
      await demo.type(app(demo).getByLabel('Your name'), 'Dana Thompson');
      await demo.type(app(demo).getByLabel('Email', { exact: true }), 'dana.t@example.com');
      await demo.type(app(demo).getByLabel('Message', { exact: true }), 'Is there still room in Saturday Sports for an 11-year-old?');
      await demo.click(app(demo).getByRole('button', { name: 'Send message' }));
      await app(demo).getByRole('heading', { name: 'Message sent' }).waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-contact-sent');
    },
  },
  {
    // Get involved: Leo signs up to volunteer, then Dana gives $50 a month.
    name: 'involved-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/site/harbourview/get-involved', { ready: false });
      await heading(demo, 'Help us keep our promises');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'desktop-get-involved');
      await demo.click(app(demo).getByRole('button', { name: 'Sign up to volunteer' }));
      const dialog = app(demo).getByRole('dialog');
      await dialog.waitFor();
      await demo.type(dialog.getByLabel('Your name'), 'Leo Martins');
      await demo.type(dialog.getByLabel('Email', { exact: true }), 'leo.martins@example.com');
      await demo.click(dialog.getByRole('checkbox'));
      await demo.pause(1200);
      await shot(demo, 'desktop-volunteer');
      await demo.click(dialog.getByRole('button', { name: 'Sign up', exact: true }));
      await app(demo).getByText('Thanks for offering to help').waitFor();
      await demo.pause(2400);
      await demo.click(app(demo).getByRole('button', { name: 'Donate' }));
      const gift = app(demo).getByRole('dialog');
      await gift.waitFor();
      await demo.click(gift.getByRole('radio', { name: /^\$50 a month/ }));
      await demo.type(gift.getByLabel('Your name'), 'Dana Thompson');
      await demo.type(gift.getByLabel('Email for your receipt'), 'dana.t@example.com');
      await demo.pause(1000);
      await shot(demo, 'desktop-donate');
      await demo.click(gift.getByRole('button', { name: 'Continue to payment' }));
      await gift.getByRole('link', { name: 'Open secure payment' }).waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-donate-confirmed');
    },
  },
  {
    // The same site on a phone: the links wrap under the name and the cards stack.
    name: 'site-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go('/site/harbourview', { ready: false });
      await heading(demo, 'Harbourview Youth Collective');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'phone-landing');
      await demo.click(nav(demo, 'Programs'));
      await heading(demo, 'Programs and open cohorts');
      await demo.pause(2200);
      await shot(demo, 'phone-programs');
      await region(demo, 'Learning tracks').scrollIntoViewIfNeeded();
      await demo.pause(1800);
    },
  },
  {
    // Northgate with Learning and Mentoring off, nothing open, a failed load and an unpublished address.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go('/site/northgate/programs', { ready: false });
      await heading(demo, 'Programs and open cohorts');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-northgate');
      state.content.harbourview = NOTHING_OPEN;
      await demo.go('/site/harbourview', { ready: false });
      await app(demo).getByRole('heading', { name: 'No programs are open right now' }).waitFor();
      await app(demo).getByRole('heading', { name: 'No programs are open right now' }).scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'desktop-empty');
      state.content.harbourview = HARBOURVIEW;
      state.fail = '/api/website/harbourview/content';
      await demo.go('/site/harbourview/programs', { ready: false });
      await app(demo).getByRole('heading', { name: 'We couldn’t load our programs' }).waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-error');
      state.fail = null;
      await demo.click(app(demo).getByRole('button', { name: 'Try again' }));
      await app(demo).getByRole('heading', { name: 'Cohorts you can join' }).waitFor();
      await demo.pause(1600);
      state.published = ['northgate'];
      await demo.go('/site/harbourview', { ready: false });
      await app(demo).getByRole('heading', { name: 'This page isn’t here' }).waitFor();
      await demo.pause(2200);
      await shot(demo, 'desktop-not-found');
    },
  },
];
