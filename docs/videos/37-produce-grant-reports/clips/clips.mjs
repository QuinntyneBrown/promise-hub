// Screen recordings for video 37, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Marisol filters by program and exports a CSV.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const marisol = { personName: 'Marisol Delgado', role: 'ProgramDirector', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };

const programs = [
  { id: 'p-tutoring', name: 'After-School Tutoring', attendanceRate: 91 },
  { id: 'p-sports', name: 'Saturday Sports', attendanceRate: 88 },
  { id: 'p-camp', name: 'Winter Camp 2026', attendanceRate: null },
];
const all = {
  childrenServed: 6, attendanceRate: 90, sessionsDelivered: 2, slipsSigned: 1,
  ages: [{ band: 'Under 6', count: '0' }, { band: '6–8', count: '1' }, { band: '9–11', count: '3' }, { band: '12–13', count: '2' }, { band: '14 and over', count: '0' }],
  programs, languages: [{ language: 'English', households: 2 }, { language: 'French', households: 1 }, { language: 'Spanish', households: 1 }], masked: false,
};
const tutoring = { ...all, childrenServed: 4, attendanceRate: 91, ages: [{ band: 'Under 6', count: '0' }, { band: '6–8', count: '0' }, { band: '9–11', count: '2' }, { band: '12–13', count: '2' }, { band: '14 and over', count: '0' }], programs: [programs[0]] };

function reportsApi() {
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/me') return route.fulfill({ json: marisol });
      if (url.pathname === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
      if (url.pathname === '/api/reports') return route.fulfill({ json: url.searchParams.get('programId') ? tutoring : all });
      if (url.pathname === '/api/reports/exports') {
        return route.fulfill({ status: 201, json: { id: 'export-1', fileName: 'harbourview-youth-collective-report-2026-11-05.csv', rows: 12, expiresAt: '2026-11-12T21:12:00Z' } });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'reports-desktop',
    run: async (demo) => {
      await reportsApi()(demo);
      await demo.go('/reports', { ready: false });
      await demo.app().getByRole('table', { name: 'Children by age' }).waitFor();
      demo.mark();
      await demo.pause(3000);
      await demo.app().getByLabel('Program', { exact: true }).selectOption({ label: 'After-School Tutoring' });
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('button', { name: 'Export' }));
      await demo.pause(1200);
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Export CSV' }));
      await demo.app().getByRole('dialog').getByText('The link works for 7 days.').waitFor();
      await demo.pause(3500);
    },
  },
];
