// Screen recordings for video 14, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: one upload, its mapping, review and results.
const modules = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const tom = { personName: 'Tom Nguyen', role: 'Admin', organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules };
const csv =
  'Student,DOB,Parent,Cell,Email,Allergies/Meds,Lang,T-shirt\n' +
  'Ava Chen,2016-04-02,Mei Chen,905-555-0201,mei.chen@example.com,,English,S\n' +
  'Leo Chen,2018-09-15,Mei Chen,905-555-0201,mei.chen@example.com,Peanuts,English,XS\n' +
  'Mateo Rivera,2017-03-14,Carmen Rivera,905-555-0142,,,Spanish,M\n' +
  'Zoe Park,2015-01-20,Jin Park,,jin.park@example.com,,English,M\n' +
  'Sam Ortiz,2016-07-07,Rosa Ortiz,,,,English,L\n';
const columns = [
  ['Student', 'Ava Chen', 'ChildName'], ['DOB', '2016-04-02', 'DateOfBirth'], ['Parent', 'Mei Chen', 'GuardianName'], ['Cell', '905-555-0201', 'GuardianPhone'],
  ['Email', 'mei.chen@example.com', 'GuardianEmail'], ['Allergies/Meds', 'Peanuts', 'Allergies'], ['Lang', 'English', 'Language'], ['T-shirt', 'S', null],
].map(([name, sample, field]) => ({ name, sample, field }));

async function fakeApi(demo) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me') return route.fulfill({ json: tom });
    if (path === '/api/programs') return route.fulfill({ json: { programs: [{ id: 'p-tutoring', name: 'After-School Tutoring' }, { id: 'p-sports', name: 'Saturday Sports' }] } });
    if (path === '/api/households') return route.fulfill({ json: { households: [], total: 0 } });
    if (path === '/api/imports') {
      const raw = route.request().postDataBuffer()?.toString('utf-8') ?? '';
      const name = /filename="([^"]+)"/.exec(raw)?.[1] ?? 'file';
      if (!name.endsWith('.csv')) return route.fulfill({ status: 422, json: { errors: { file: `We couldn’t read ${name}. Export it as CSV or XLSX and try again. Nothing was imported.` } } });
      return route.fulfill({ status: 201, json: { id: 'imp-1', fileName: name, rowCount: 5, matched: 7, columns } });
    }
    if (path === '/api/imports/imp-1/mapping') {
      return route.fulfill({ json: { rows: 5, duplicates: [{ row: 4, child: 'Mateo Rivera', reason: 'Already in PromiseHub' }], needLook: [{ row: 5, child: 'Zoe Park', reason: 'No mobile; email only' }, { row: 6, child: 'Sam Ortiz', reason: 'No phone or email' }], programName: 'Saturday Sports' } });
    }
    if (path === '/api/imports/imp-1/run') {
      return route.fulfill({ json: { fileName: 'roster-fall-2026.csv', rows: 5, imported: 3, familiesCreated: 2, familiesUpdated: 0, children: 3, enrolled: 3, skipped: 1, needFix: 1, toFix: [{ row: 6, child: 'Sam Ortiz', reason: 'No phone or email' }], programName: 'Saturday Sports' } });
    }
    return route.fulfill({ status: 599 });
  });
}

async function open(demo) {
  await fakeApi(demo);
  await demo.go('/import', { ready: false });
  await demo.app().getByRole('heading', { name: 'Import a roster' }).waitFor();
  await demo.pause(800);
}

export default [
  {
    name: 'import-desktop',
    run: async (demo) => {
      await open(demo);
      demo.mark();
      await demo.pause(1800);
      await demo.app().getByLabel('Choose file').setInputFiles({ name: 'roster-fall-2026.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
      await demo.app().getByText('7 of 8 columns matched automatically').waitFor();
      await demo.pause(3000);
      await demo.app().getByLabel('Enroll everyone in').selectOption({ label: 'Saturday Sports' });
      await demo.pause(1000);
      await demo.click(demo.app().getByRole('button', { name: 'Review' }));
      await demo.app().getByRole('heading', { name: 'Already in PromiseHub' }).waitFor();
      await demo.pause(3500);
      await demo.click(demo.app().getByRole('button', { name: /^Import \d+ rows$/ }));
      await demo.app().getByRole('heading', { name: 'Imported 3 of 5 rows' }).waitFor();
      await demo.pause(3500);
    },
  },
  {
    name: 'wrong-file-phone',
    phone: true,
    run: async (demo) => {
      await open(demo);
      demo.mark();
      await demo.pause(1500);
      await demo.app().getByLabel('Choose file').setInputFiles({ name: 'roster-fall-2026.numbers', mimeType: 'application/octet-stream', buffer: Buffer.from([0, 1, 2, 3]) });
      await demo.app().getByText('We couldn’t read that file').waitFor();
      await demo.pause(3500);
      await demo.app().getByLabel('Choose file').setInputFiles({ name: 'roster-fall-2026.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
      await demo.app().getByText('7 of 8 columns matched automatically').waitFor();
      await demo.pause(3000);
    },
  },
];
