// Screen recordings and screenshots for video 80, made with tools/video-record/record-clips.mjs against the running
// frontend. The backend is faked like the e2e suite: Marisol Delgado (Program director) opens Reports and its Detailed
// reports, the cohort report for After-School Tutoring and Nadia's youth report, the progress board with its export and
// staff activity; Tom Nguyen (Admin) imports a roster with Group and Youth email columns; Marisol on her phone; then
// Grace Mensah at Northgate, where Learning and Mentoring are off, Aisha's forbidden page, an empty cohort and a failed
// load (L2-127 to L2-131, ADR 0074).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');
const SUITE = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'];
const PEOPLE = {
  'm-marisol': { personName: 'Marisol Delgado', role: 'ProgramDirector', org: 'harbourview' },
  'm-tom': { personName: 'Tom Nguyen', role: 'Admin', org: 'harbourview' },
  'm-aisha': { personName: 'Aisha Bello', role: 'YouthWorker', org: 'harbourview' },
  'm-grace': { personName: 'Grace Mensah', role: 'Admin', org: 'northgate' },
};
const ORGS = {
  harbourview: { id: 'org-harbourview', name: 'Harbourview Youth Collective', plan: 'Standard', modules: SUITE },
  northgate: { id: 'org-northgate', name: 'Northgate Community Church Kids', plan: 'Free', modules: ['Roster', 'RollCall', 'QuickCards', 'Reports'] },
};
const PROGRAMS = {
  harbourview: [
    { id: 'p-tutoring', name: 'After-School Tutoring' },
    { id: 'p-sports', name: 'Saturday Sports' },
    { id: 'p-winter', name: 'Winter Camp 2026' },
  ],
  northgate: [{ id: 'p-kids-club', name: 'Kids Club' }],
};

const SUMMARY = {
  childrenServed: 7,
  attendanceRate: 83,
  sessionsDelivered: 2,
  slipsSigned: 41,
  ages: [
    { band: 'Under 6', count: '0' },
    { band: '6–8', count: '2' },
    { band: '9–11', count: '2' },
    { band: '12–13', count: '2' },
    { band: '14 and over', count: '1' },
  ],
  programs: [
    { id: 'p-tutoring', name: 'After-School Tutoring', attendanceRate: 83 },
    { id: 'p-sports', name: 'Saturday Sports', attendanceRate: null },
    { id: 'p-winter', name: 'Winter Camp 2026', attendanceRate: null },
  ],
  languages: [
    { language: 'English', households: 4 },
    { language: 'Spanish', households: 1 },
    { language: 'French', households: 1 },
  ],
  masked: false,
  surveyResponses: 0,
  surveyAverage: null,
};

const youthRow = (childId, name, hasAccount, learning, attendanceRate, checkIns, status) => ({ childId, name, hasAccount, learning, attendanceRate, checkIns, status });
const TUTORING = {
  programId: 'p-tutoring',
  name: 'After-School Tutoring',
  trackName: 'Leadership Foundations',
  enrolled: 5,
  ended: 0,
  retentionRate: 100,
  attendanceRate: 83,
  learning: {
    averageCompletion: 63,
    modules: [
      { moduleId: 'cm-knowing', title: 'Knowing Yourself', completion: 100 },
      { moduleId: 'cm-serving', title: 'Leading by Serving', completion: 25 },
    ],
  },
  atRisk: 1,
  comparison: { attendanceRate: 83, retentionRate: 100, averageCompletion: 63 },
  youth: [
    youthRow('c-jordan', 'Jordan Thompson', false, null, 100, 0, 'OnTrack'),
    youthRow('c-mateo', 'Mateo Rivera', false, null, 100, 2, 'OnTrack'),
    youthRow('c-nadia', 'Nadia Haddad', true, 75, 100, 3, 'OnTrack'),
    youthRow('c-sofia', 'Sofía Rivera', true, 50, 50, 1, 'OnTrack'),
    youthRow('c-yusuf', 'Yusuf Haddad', false, null, 67, 0, 'AtRisk'),
  ],
};
const SPORTS = {
  ...TUTORING,
  programId: 'p-sports',
  name: 'Saturday Sports',
  trackName: null,
  enrolled: 2,
  attendanceRate: null,
  learning: { averageCompletion: null, modules: [] },
  atRisk: 0,
  youth: [youthRow('c-emily', 'Emily Tran', false, null, null, 0, 'OnTrack'), youthRow('c-kevin', 'Kevin Tran', false, null, null, 0, 'OnTrack')],
};
const WINTER = { ...SPORTS, programId: 'p-winter', name: 'Winter Camp 2026', enrolled: 0, retentionRate: null, youth: [] };
const KIDS_CLUB = {
  programId: 'p-kids-club',
  name: 'Kids Club',
  trackName: null,
  enrolled: 2,
  ended: 0,
  retentionRate: 100,
  attendanceRate: 100,
  learning: null,
  atRisk: null,
  comparison: { attendanceRate: 100, retentionRate: 100, averageCompletion: null },
  youth: [youthRow('c-ng-lucia', 'Lucía Rivera', true, null, 100, null, 'OnTrack'), youthRow('c-ng-mateo', 'Mateo Rivera', false, null, 100, null, 'OnTrack')],
};
const COHORTS = { 'p-tutoring': TUTORING, 'p-sports': SPORTS, 'p-winter': WINTER, 'p-kids-club': KIDS_CLUB };

const YOUTH = {
  'c-nadia': {
    childId: 'c-nadia',
    name: 'Nadia Haddad',
    age: 18,
    programs: ['After-School Tutoring'],
    hasAccount: true,
    learning: {
      completedLessons: 3,
      totalLessons: 4,
      completion: 75,
      quizAverage: 88,
      modules: [
        { moduleId: 'cm-knowing', title: 'Knowing Yourself', done: 2, total: 2, state: 'Done' },
        { moduleId: 'cm-serving', title: 'Leading by Serving', done: 1, total: 2, state: 'InProgress' },
      ],
      quizzes: [
        { quizId: 'qz-knowing', title: 'Knowing Yourself quiz', bestScore: 100 },
        { quizId: 'qz-serving', title: 'Leading by Serving quiz', bestScore: 75 },
      ],
      badges: ['First Steps'],
    },
    attendance: { present: 1, late: 1, excused: 0, absent: 0, rate: 100 },
    mentoring: { mentorName: 'Daniel Osei', checkIns: 3, latestOn: '2026-11-03', latestEngagement: 'Engaged', openFlag: false },
  },
  'c-mateo': {
    childId: 'c-mateo',
    name: 'Mateo Rivera',
    age: 9,
    programs: ['After-School Tutoring'],
    hasAccount: false,
    learning: null,
    attendance: { present: 2, late: 0, excused: 0, absent: 0, rate: 100 },
    mentoring: { mentorName: 'Daniel Osei', checkIns: 2, latestOn: '2026-11-01', latestEngagement: 'Steady', openFlag: false },
  },
};

const BOARD = {
  programId: 'p-tutoring',
  programName: 'After-School Tutoring',
  trackName: 'Leadership Foundations',
  modules: [
    { moduleId: 'cm-knowing', title: 'Knowing Yourself' },
    { moduleId: 'cm-serving', title: 'Leading by Serving' },
  ],
  youth: [
    { childId: 'c-jordan', name: 'Jordan Thompson', cells: ['NoAccount', 'NoAccount'], quizAverage: null, overall: null },
    { childId: 'c-mateo', name: 'Mateo Rivera', cells: ['NoAccount', 'NoAccount'], quizAverage: null, overall: null },
    { childId: 'c-nadia', name: 'Nadia Haddad', cells: ['Done', 'InProgress'], quizAverage: 88, overall: 75 },
    { childId: 'c-sofia', name: 'Sofía Rivera', cells: ['Done', 'NotStarted'], quizAverage: 70, overall: 50 },
    { childId: 'c-yusuf', name: 'Yusuf Haddad', cells: ['NoAccount', 'NoAccount'], quizAverage: null, overall: null },
  ],
  average: { modules: [100, 25], quizAverage: 79, overall: 63 },
};

const STAFF = {
  activeMentors: 2,
  checkIns: 14,
  reviews: 6,
  averageCaseload: 5,
  mentors: [
    {
      membershipId: 'm-daniel',
      name: 'Daniel Osei',
      cohorts: [
        { programId: 'p-tutoring', name: 'After-School Tutoring', lead: false },
        { programId: 'p-sports', name: 'Saturday Sports', lead: true },
      ],
      caseload: 9,
      checkIns: 11,
      reviews: 5,
      load: 'Overloaded',
    },
    { membershipId: 'm-hana', name: 'Hana Kim', cohorts: [{ programId: 'p-tutoring', name: 'After-School Tutoring', lead: true }], caseload: 1, checkIns: 3, reviews: 1, load: 'Underloaded' },
  ],
};

const ROSTER_CSV =
  'Student,DOB,Parent,Cell,Group,Youth email\n' +
  'Ava Chen,2012-04-02,Mei Chen,905-555-0201,After-School Tutoring,ava.chen@example.com\n' +
  'Leo Chen,2018-09-15,Mei Chen,905-555-0201,Saturday Sports,leo.chen@example.com\n' +
  'Zoe Campbell,2013-01-20,Tanya Campbell,905-555-0320,Drama Club,\n' +
  'Kai Lee,2011-06-01,Ann Lee,905-555-0401,,ava.chen@example.com\n';

const newState = (who, x = {}) => ({ who, fail: null, ...x });

/** The report and import endpoints as the real API answers them (DetailedReportsHandler, ReportsHandler, the import handlers). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const p = PEOPLE[state.who];
    const org = ORGS[p.org];
    const reports = ['Admin', 'ProgramDirector', 'SiteLead'].includes(p.role);
    if (state.fail && path === state.fail) return route.fulfill({ status: 500 });
    if (path === '/api/me')
      return route.fulfill({
        json: { personName: p.personName, role: p.role, organizationId: org.id, organizationName: org.name, plan: org.plan, modules: org.modules, membershipId: state.who, display: { theme: 'system', textSize: 'default', reduceMotion: false } },
      });
    if (path === '/api/programs') return route.fulfill({ json: { programs: PROGRAMS[p.org], active: PROGRAMS[p.org].length, archived: 0, enrolled: 7 } });
    if (path.startsWith('/api/reports') && !reports) return route.fulfill({ status: 403, json: { code: 'forbidden' } });
    if (path === '/api/reports') return route.fulfill({ json: p.org === 'harbourview' ? SUMMARY : { ...SUMMARY, programs: [{ id: 'p-kids-club', name: 'Kids Club', attendanceRate: 100 }], childrenServed: 2 } });
    let m = /^\/api\/reports\/cohorts\/([^/]+)$/.exec(path);
    if (m) {
      const cohort = COHORTS[m[1]];
      return cohort && PROGRAMS[p.org].some((x) => x.id === m[1]) ? route.fulfill({ json: cohort }) : route.fulfill({ status: 404 });
    }
    m = /^\/api\/reports\/youth\/([^/]+)$/.exec(path);
    if (m) return YOUTH[m[1]] ? route.fulfill({ json: YOUTH[m[1]] }) : route.fulfill({ status: 404 });
    if (/^\/api\/reports\/progress\//.test(path)) return route.fulfill({ json: BOARD });
    if (path === '/api/reports/staff') return route.fulfill({ json: STAFF });
    if (path === '/api/reports/exports' && req.method() === 'POST') {
      const b = req.postDataJSON();
      const fileName = b.kind === 'Progress' ? 'harbourview-youth-collective-progress-after-school-tutoring-2026-11-05.csv' : 'harbourview-youth-collective-cohort-after-school-tutoring-2026-11-05.csv';
      return route.fulfill({ status: 201, json: { id: 'export-1', fileName, rows: 5, expiresAt: '2026-11-12T21:12:00Z' } });
    }
    if (path === '/api/imports' && req.method() === 'POST')
      return route.fulfill({
        status: 201,
        json: {
          id: 'imp-1',
          fileName: 'harbourview-roster.csv',
          rowCount: 4,
          matched: 6,
          columns: [
            { name: 'Student', sample: 'Ava Chen', field: 'ChildName' },
            { name: 'DOB', sample: '2012-04-02', field: 'DateOfBirth' },
            { name: 'Parent', sample: 'Mei Chen', field: 'GuardianName' },
            { name: 'Cell', sample: '905-555-0201', field: 'GuardianPhone' },
            { name: 'Group', sample: 'After-School Tutoring', field: 'Cohort' },
            { name: 'Youth email', sample: 'ava.chen@example.com', field: 'YouthEmail' },
          ],
        },
      });
    if (path === '/api/imports/imp-1/mapping')
      return route.fulfill({
        json: {
          rows: 4,
          duplicates: [],
          needLook: [
            { row: 3, child: 'Leo Chen', reason: 'Youth accounts are for ages 12 to 18; not invited' },
            { row: 4, child: 'Zoe Campbell', reason: 'No cohort called “Drama Club”; imported, not placed' },
            { row: 5, child: 'Kai Lee', reason: 'Used on row 2; not invited' },
          ],
          programName: null,
          placements: 2,
          invitations: 1,
        },
      });
    if (path === '/api/imports/imp-1/run')
      return route.fulfill({
        json: {
          fileName: 'harbourview-roster.csv',
          rows: 4,
          imported: 4,
          familiesCreated: 3,
          familiesUpdated: 0,
          children: 4,
          enrolled: 2,
          skipped: 0,
          needFix: 0,
          toFix: [],
          programName: null,
          invited: 1,
          notPlaced: [{ row: 4, child: 'Zoe Campbell', reason: 'No cohort called “Drama Club”; imported, not placed' }],
          notInvited: [
            { row: 3, child: 'Leo Chen', reason: 'Youth accounts are for ages 12 to 18; not invited' },
            { row: 5, child: 'Kai Lee', reason: 'Used on row 2; not invited' },
          ],
        },
      });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });

export default [
  {
    // Marisol opens Reports, Detailed reports, the cohort report and Nadia's youth report.
    name: 'cohort-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-marisol'));
      await demo.go('/reports', { ready: false });
      await heading(demo, 'Reports');
      demo.mark();
      await app(demo).getByRole('list', { name: 'Detailed reports' }).scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'desktop-detailed');
      await demo.click(app(demo).getByRole('link', { name: /^Cohort report/ }));
      await heading(demo, 'After-School Tutoring');
      await demo.pause(2400);
      await shot(demo, 'desktop-cohort');
      await app(demo).getByRole('table', { name: /^Youth in/ }).scrollIntoViewIfNeeded();
      await demo.pause(2000);
      await shot(demo, 'desktop-cohort-youth');
      await demo.click(app(demo).getByRole('link', { name: 'Nadia Haddad', exact: true }));
      await heading(demo, 'Nadia Haddad');
      await demo.pause(2600);
      await shot(demo, 'desktop-youth');
      await app(demo).getByRole('region', { name: 'Mentoring' }).scrollIntoViewIfNeeded();
      await demo.pause(1800);
    },
  },
  {
    // The progress board and its export, then staff activity with Daniel overloaded.
    name: 'board-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-marisol'));
      await demo.go('/reports/progress', { ready: false });
      await heading(demo, 'Progress board');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-board');
      await demo.click(button(demo, 'Export CSV'));
      const d = app(demo).getByRole('dialog');
      await d.waitFor();
      await demo.pause(1200);
      await demo.click(d.getByRole('button', { name: 'Export CSV' }));
      await d.getByText('Export ready').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-export');
      await demo.click(d.getByRole('button', { name: 'Close', exact: true }).last());
      await demo.go('/reports/staff', { ready: false });
      await heading(demo, 'Staff activity');
      await demo.pause(2600);
      await shot(demo, 'desktop-staff');
    },
  },
  {
    // Tom imports a roster whose Group column places children in cohorts and whose Youth email column invites youth.
    name: 'import-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState('m-tom'));
      await demo.go('/import', { ready: false });
      await heading(demo, 'Import a roster');
      demo.mark();
      await demo.pause(1600);
      await app(demo).getByLabel('Choose file').setInputFiles({ name: 'harbourview-roster.csv', mimeType: 'text/csv', buffer: Buffer.from(ROSTER_CSV) });
      await app(demo).getByText('6 of 6 columns matched automatically').waitFor();
      await app(demo).getByLabel('Map Group').scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'desktop-import-mapping');
      await demo.click(button(demo, 'Review'));
      await app(demo).getByRole('group', { name: 'Cohorts and invitations' }).waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-import-review');
      await demo.click(app(demo).getByRole('button', { name: /^Import \d+ rows$/ }));
      await app(demo).getByRole('heading', { name: 'Imported 4 of 4 rows' }).waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-import-done');
    },
  },
  {
    // Marisol on her phone: the cohort report and the progress board scrolling sideways in its own frame.
    name: 'reports-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState('m-marisol'));
      await demo.go('/reports/cohorts/p-tutoring', { ready: false });
      await heading(demo, 'After-School Tutoring');
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-cohort');
      await demo.go('/reports/progress', { ready: false });
      await heading(demo, 'Progress board');
      const board = app(demo).getByRole('region', { name: /^Progress board/ });
      await board.scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await shot(demo, 'phone-board');
      await board.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' }));
      await demo.pause(2200);
    },
  },
  {
    // Northgate with Learning and Mentoring off, Aisha's forbidden page, an empty cohort and a failed load.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState('m-grace');
      await fakeApi(demo, state);
      await demo.go('/reports', { ready: false });
      await heading(demo, 'Reports');
      demo.mark();
      await app(demo).getByRole('list', { name: 'Detailed reports' }).scrollIntoViewIfNeeded();
      await demo.pause(1800);
      await demo.click(app(demo).getByRole('link', { name: /^Cohort report/ }));
      await heading(demo, 'Kids Club');
      await demo.pause(2200);
      await shot(demo, 'desktop-northgate');
      Object.assign(state, newState('m-aisha'));
      await demo.go('/reports/cohorts/p-tutoring', { ready: false });
      await app(demo).getByRole('heading', { name: 'Reports are for directors and site leads' }).waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-forbidden');
      Object.assign(state, newState('m-marisol'));
      await demo.go('/reports/cohorts/p-winter', { ready: false });
      await app(demo).getByRole('heading', { name: 'No youth in this cohort yet' }).waitFor();
      await demo.pause(1800);
      await shot(demo, 'desktop-empty');
      Object.assign(state, newState('m-marisol', { fail: '/api/reports/youth/c-mateo' }));
      await demo.go('/reports/youth/c-mateo', { ready: false });
      await app(demo).getByRole('heading', { name: 'We couldn’t build the youth report' }).waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-error');
      state.fail = null;
      await demo.click(button(demo, 'Try again'));
      await heading(demo, 'Mateo Rivera');
      await demo.pause(2000);
      await shot(demo, 'desktop-no-account');
    },
  },
];
