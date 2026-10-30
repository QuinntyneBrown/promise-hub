// Screen recordings and screenshots for video 91, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: Marisol Delgado (Program director) at Harbourview reads the Learning Bond dashboard (six figures, a row per
// covered program, Fewer than 5 where a program has few families), filters by period, and exports for funders; a youth worker is told who
// sees it (L2-141, L2-143). Counts and sums only; no family appears anywhere.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const SUITE = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring', 'LearningBond'];
const PEOPLE = {
  'm-marisol': { personName: 'Marisol Delgado', role: 'ProgramDirector' },
  'm-aisha': { personName: 'Aisha Bello', role: 'YouthWorker' },
};
const PROGRAMS = [
  { id: 'p-tutoring', name: 'After-School Tutoring', households: 48 },
  { id: 'p-sports', name: 'Saturday Sports', households: 57 },
  { id: 'p-winter', name: 'Winter Camp 2026', households: 3 },
];
// Raw figures per program for all time and the last 30 days.
const FIGURES = {
  all: {
    'After-School Tutoring': [48, 22, 12, 15, 21000, 4200, 7000, 1680],
    'Saturday Sports': [57, 19, 7, 9, 11800, 1500, 3300, 0],
    'Winter Camp 2026': [3, 2, 1, 1, 1400, 0, 0, 0],
  },
  30: {
    'After-School Tutoring': [11, 6, 5, 6, 8400, 1680, 1400, 0],
    'Saturday Sports': [9, 5, 0, 0, 0, 0, 0, 0],
    'Winter Camp 2026': [0, 0, 0, 0, 0, 0, 0, 0],
  },
};

const count = (n) => (n > 0 && n < 5 ? 'FewerThan5' : String(n));
const dto = (program, f) => {
  const [invited, started, completed, children, estLb, estBen, confLb, confBen] = f;
  const suppressed = (started > 0 && started < 5) || (completed > 0 && completed < 5);
  return {
    program,
    invited: count(invited),
    started: count(started),
    completed: count(completed),
    children: count(children),
    estimated: suppressed ? null : { total: estLb + estBen, learningBond: estLb, benefits: estBen },
    confirmed: suppressed ? null : { total: confLb + confBen, learningBond: confLb, benefits: confBen },
  };
};
const sum = (rows) => rows.reduce((a, b) => a.map((x, i) => x + b[i]), [0, 0, 0, 0, 0, 0, 0, 0]);

/** The staff endpoints the dashboard uses, as the real API answers them (LearningBondDashboardHandler). */
async function fakeApi(demo, who) {
  await demo.page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const p = PEOPLE[who];
    if (path === '/api/me')
      return route.fulfill({
        json: { personName: p.personName, role: p.role, organizationId: 'org-harbourview', organizationName: ORG, plan: 'Standard', modules: SUITE, membershipId: who, learningBondStatus: true, display: { theme: 'system', textSize: 'default', reduceMotion: false } },
      });
    if (path === '/api/today') return route.fulfill({ json: { activeChildren: 6, households: 4, slipsDue: [], comingUp: [], tasks: [] } });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/learning-bond') return route.fulfill({ json: { on: true } });
    if (path === '/api/learning-bond/dashboard') {
      if (p.role === 'YouthWorker') return route.fulfill({ status: 403, json: { code: 'forbidden' } });
      const period = url.searchParams.get('period') ?? 'all';
      const table = FIGURES[period === '30' ? 30 : 'all'];
      const chosen = PROGRAMS.find((x) => x.id === url.searchParams.get('program'));
      const names = chosen ? [chosen.name] : PROGRAMS.map((x) => x.name);
      return route.fulfill({
        json: {
          programs: PROGRAMS,
          period,
          program: chosen?.id ?? null,
          all: dto(null, sum(names.map((n) => table[n]))),
          rows: names.map((n) => dto(n, table[n])),
          empty: false,
        },
      });
    }
    if (path === '/api/learning-bond/exports')
      return route.fulfill({ status: 201, json: { id: 'export-lb-1', fileName: 'harbourview-youth-collective-learning-bond-all-2026-11-05.csv', rows: 4, expiresAt: '2026-11-12T21:12:00Z' } });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

export default [
  {
    // The figures, a period, the table with Fewer than 5, and Export for funders.
    name: 'dashboard-desktop',
    run: async (demo) => {
      await fakeApi(demo, 'm-marisol');
      await demo.go('/learning-bond', { ready: false });
      await heading(demo, 'Learning Bond');
      await app(demo).getByTestId('dashboard-figures').waitFor();
      demo.mark();
      await demo.pause(3600);
      await shot(demo, 'desktop-dashboard');
      await app(demo).getByRole('table').scrollIntoViewIfNeeded();
      await demo.pause(3200);
      await shot(demo, 'desktop-programs');
      await app(demo).getByLabel('Period').scrollIntoViewIfNeeded();
      await app(demo).getByLabel('Period').selectOption({ label: 'Last 30 days' });
      await demo.pause(3200);
      await shot(demo, 'desktop-last-30-days');
      await demo.click(app(demo).getByRole('button', { name: 'Export for funders' }));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-export');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Export' }));
      await app(demo).getByTestId('export-ready').waitFor();
      await demo.pause(3000);
      await shot(demo, 'desktop-export-ready');
    },
  },
  {
    // The dashboard on a phone, and a youth worker without ViewReports.
    name: 'dashboard-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, 'm-marisol');
      await demo.go('/learning-bond', { ready: false });
      await app(demo).getByTestId('dashboard-figures').waitFor();
      demo.mark();
      await demo.pause(2800);
      await shot(demo, 'phone-dashboard');
      await app(demo).getByRole('table').scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'phone-programs');
    },
  },
  {
    // A youth worker is told who sees it.
    name: 'forbidden-desktop',
    run: async (demo) => {
      await fakeApi(demo, 'm-aisha');
      await demo.go('/learning-bond', { ready: false });
      await app(demo).getByText('Admins and program directors see the dashboard').waitFor();
      demo.mark();
      await demo.pause(3000);
      await shot(demo, 'desktop-forbidden');
    },
  },
];
