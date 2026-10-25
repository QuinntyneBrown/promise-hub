// Screen recordings for video 04, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite, with the Harbourview cast.
const people = {
  tom: { personName: 'Tom Nguyen', role: 'Admin' },
  aisha: { personName: 'Aisha Bello', role: 'YouthWorker' },
};

function seed() {
  const med = (allergies, medication, conditions, doctor, redAlert) => ({
    allergies, medication, conditions, doctor, redAlert, updatedAt: '2026-09-02T19:55:00Z', updatedBy: 'Carmen Rivera',
  });
  return [
    {
      id: 'hh-rivera', name: 'Rivera', language: 'Spanish',
      guardians: [
        { id: 'g-carmen', name: 'Carmen Rivera', relationship: 'Mother', mobile: '905-555-0142', email: 'carmen.rivera@example.com', language: 'Spanish', isPrimary: true, canPickUp: true, canSign: true },
        { id: 'g-luis', name: 'Luis Rivera', relationship: 'Uncle or aunt', mobile: '905-555-0199', email: null, language: 'Spanish', isPrimary: false, canPickUp: true, canSign: false },
      ],
      children: [
        { id: 'c-mateo', firstName: 'Mateo', lastName: 'Rivera', dateOfBirth: '2017-03-14', age: 9, school: 'Bennetto Elementary, Grade 4',
          medical: med('Peanuts (anaphylaxis); tree nuts (hives)', 'EpiPen 0.3 mg, carried', null, 'Dr. Amrita Sethi · 905-555-0100', true) },
        { id: 'c-sofia', firstName: 'Sofía', lastName: 'Rivera', dateOfBirth: '2014-06-02', age: 12, school: 'Bennetto Elementary, Grade 7',
          medical: med(null, 'Inhaler as needed', 'Asthma', null, false) },
      ],
    },
    { id: 'hh-thompson', name: 'Thompson', language: 'English',
      guardians: [{ id: 'g-dana', name: 'Dana Thompson', relationship: 'Mother', mobile: '905-555-0117', email: null, language: 'English', isPrimary: true, canPickUp: true, canSign: true }],
      children: [{ id: 'c-jordan', firstName: 'Jordan', lastName: 'Thompson', dateOfBirth: '2015-02-20', age: 11, school: 'Hess Street School, Grade 6', medical: med(null, null, null, null, false) }] },
    { id: 'hh-okonkwo', name: 'Okonkwo', language: 'English', missing: true,
      guardians: [{ id: 'g-chidi', name: 'Chidi Okonkwo', relationship: 'Father', mobile: null, email: 'chidi.okonkwo@example.com', language: 'English', isPrimary: true, canPickUp: true, canSign: true }],
      children: [{ id: 'c-amara', firstName: 'Amara', lastName: 'Okonkwo', dateOfBirth: '2019-04-11', age: 7, school: 'Bennetto Elementary, Grade 2', medical: med(null, null, null, null, false) }] },
  ];
}

async function fakeApi(demo, who) {
  const person = people[who];
  const medicalRole = person.role !== 'YouthWorker';
  const households = seed();
  const flag = (c) => (c.medical.allergies ? 'Allergy' : c.medical.medication ? 'Medication' : c.medical.conditions);
  await demo.page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (path === '/api/me') {
      return route.fulfill({ json: { ...person, organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard',
        modules: ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'] } });
    }
    if (path === '/api/households') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const rows = households.map((h) => ({
        id: h.id, name: h.name, primaryGuardian: h.guardians[0].name, children: h.children.map((c) => `${c.firstName} (${c.age})`),
        language: h.language, medicalFlags: h.children.filter(flag).length, missingInfo: !!h.missing,
        text: `${h.name} ${h.guardians.map((g) => g.name).join(' ')} ${h.children.map((c) => c.firstName).join(' ')}`.toLowerCase(),
      }));
      return route.fulfill({ json: {
        households: rows.filter((r) => !q || r.text.includes(q)).map(({ text, ...r }) => r),
        counts: { all: rows.length, missingInfo: 1, spanish: 1, french: 0, children: 4 },
      } });
    }
    const hh = path.match(/^\/api\/households\/([^/]+)$/);
    if (hh) {
      const h = households.find((x) => x.id === hh[1]);
      return route.fulfill({ json: { id: h.id, name: h.name, language: h.language, guardians: h.guardians, medicalRestricted: !medicalRole,
        children: h.children.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, age: c.age, school: c.school, medicalFlag: medicalRole ? flag(c) ?? null : null })) } });
    }
    const add = path.match(/^\/api\/households\/([^/]+)\/children$/);
    if (add) {
      const b = route.request().postDataJSON();
      const [first, ...rest] = b.name.split(' ');
      households.find((x) => x.id === add[1]).children.unshift({ id: 'c-new', firstName: first, lastName: rest.join(' '), dateOfBirth: b.dateOfBirth, age: 6,
        school: b.school, medical: { allergies: null, medication: null, conditions: null, doctor: null, redAlert: false, updatedAt: null, updatedBy: null } });
      return route.fulfill({ status: 201, json: { id: 'c-new' } });
    }
    const ch = path.match(/^\/api\/children\/([^/]+)(\/medical)?$/);
    if (ch) {
      const h = households.find((x) => x.children.some((c) => c.id === ch[1]));
      const c = h.children.find((x) => x.id === ch[1]);
      if (method === 'PUT') {
        c.medical = { ...route.request().postDataJSON(), updatedAt: '2026-11-05T21:12:00Z', updatedBy: person.personName };
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { id: c.id, name: `${c.firstName} ${c.lastName}`, firstName: c.firstName, lastName: c.lastName, dateOfBirth: c.dateOfBirth,
        age: c.age, school: c.school, householdId: h.id, householdName: h.name, medical: medicalRole ? c.medical : null, medicalRestricted: !medicalRole } });
    }
    return route.fulfill({ status: 599 });
  });
}

async function open(demo, path) {
  await demo.go(path, { ready: false });
  await demo.app().getByRole('heading', { level: 1 }).waitFor();
  await demo.pause(600);
}

export default [
  {
    name: 'households-desktop',
    run: async (demo) => {
      await fakeApi(demo, 'tom');
      await open(demo, '/families');
      demo.mark();
      const app = demo.app();
      await demo.pause(1500);
      await demo.type(app.getByRole('searchbox', { name: 'Search families and children' }), 'mateo');
      await demo.pause(1200);
      await demo.click(app.getByRole('link', { name: /^Rivera/ }));
      await app.getByRole('list', { name: 'Children' }).waitFor();
      await demo.pause(1200);
      await demo.click(app.getByRole('button', { name: 'Add child' }));
      const dialog = app.getByRole('dialog');
      await demo.type(dialog.getByLabel('Child’s name'), 'Lucía Rivera');
      await dialog.getByLabel('Date of birth').fill('2020-01-18');
      await demo.type(dialog.getByLabel('School and grade (optional)'), 'Bennetto Elementary, Kindergarten');
      await demo.click(dialog.getByRole('button', { name: 'Add child' }));
      await demo.pause(1500);
      await demo.click(app.getByRole('link', { name: /^Mateo Rivera/ }));
      await app.getByRole('region', { name: 'Medical and emergency' }).waitFor();
      await demo.pause(1200);
      await demo.click(app.getByRole('button', { name: 'Edit medical' }));
      const allergies = app.getByRole('dialog').getByLabel('Allergies');
      await demo.click(allergies);
      await allergies.press('End');
      await allergies.pressSequentially('; sesame', { delay: 55 });
      await demo.click(app.getByRole('dialog').getByRole('button', { name: 'Save medical details' }));
      await demo.pause(2500);
    },
  },
  {
    name: 'restricted-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, 'aisha');
      await open(demo, '/families/hh-rivera');
      demo.mark();
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('link', { name: /^Mateo Rivera/ }));
      await demo.app().getByRole('region', { name: 'Medical and emergency' }).waitFor();
      await demo.pause(2500);
    },
  },
];
