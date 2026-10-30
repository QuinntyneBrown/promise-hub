// Screen recordings and screenshots for video 87, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: Carmen Rivera comes back to her Learning Bond link after Submit. Northfield received Mateo's application,
// then asks for proof of address, which she uploads and sends; later the deposit lands. For Sofía she has no SIN yet, so the claim pauses
// with how to get one and a reminder; she reopens the link and picks up at Sofía's details. Then the tax-return pause on a laptop
// (L2-150, L2-151). No full SIN appears anywhere.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const TOKEN = 'tok-lb-rivera';
const PROVIDER = 'Northfield Credit Union';
const CHILDREN = {
  'c-mateo': { id: 'c-mateo', firstName: 'Mateo', lastName: 'Rivera', born: '2017-03-14', age: 9, amount: 1400 },
  'c-sofia': { id: 'c-sofia', firstName: 'Sofía', lastName: 'Rivera', born: '2014-06-02', age: 12, amount: 1700 },
};

const newState = (x = {}) => ({
  // Mateo's application: Submitted, Received or Deposited, and any document Northfield asked for.
  mateo: 'Submitted',
  document: null,
  // Sofía's claim: consented, her SIN not given yet, and whether it is paused and reminded.
  sofia: { paused: null, reminder: null, childSin: null },
  taxFiled: 'Yes',
  ...x,
});

const fields = (c, childSin) => ({
  beneficiaryName: `${c.firstName} ${c.lastName}`,
  dateOfBirth: c.born,
  childSin,
  caregiverName: 'Carmen Rivera',
  address: '42 Barton St E, Apt 3, Hamilton ON L8L 2V6',
  guardianSin: '212',
  phone: '905-555-0142',
  email: 'carmen.rivera@example.com',
  language: 'Spanish',
});

/** The guardian Learning Bond endpoints as the real API answers them (progress, documents, pauses and reminders). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    if (path === `/api/g/learning-bond/${TOKEN}`) return route.fulfill({ json: { organization: ORG, language: 'en' } });
    const rest = path.slice(`/api/g/learning-bond/${TOKEN}`.length);
    if (rest === '/page')
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          phone: '905-555-0100',
          explanation: `The Canada Learning Bond is money the Government of Canada puts in a child’s RESP for families with lower incomes. You don’t need to put in any money. What you enter goes to the RESP provider and the Government of Canada, not to ${ORG}.`,
          children: Object.values(CHILDREN).map((c) => ({
            id: c.id,
            firstName: c.firstName,
            age: c.age,
            programs: ['After‑School Tutoring'],
            amount: c.amount,
            selfClaim: false,
            claim: c.id === 'c-mateo' ? state.mateo : state.sofia.paused ? 'Paused' : 'Started',
          })),
          status: 'Invited',
        },
      });
    const step = rest.match(/^\/children\/([^/]+)\/(progress|intake|pause|paused|reminder|estimate)$/);
    if (step) {
      const c = CHILDREN[step[1]];
      if (step[2] === 'progress')
        return route.fulfill({
          json: {
            language: 'en',
            organization: ORG,
            explanation: `Done. ${PROVIDER} has the application. I’ll text you at each step; there’s nothing else for you to do now.`,
            applicationId: 'app-mateo',
            childId: c.id,
            firstName: c.firstName,
            provider: PROVIDER,
            status: state.mateo,
            submittedAt: '2026-11-05T21:12:00Z',
            estimate: c.amount,
            depositAmount: state.mateo === 'Deposited' ? 1400 : null,
            stepsDone: state.mateo === 'Received' ? 1 : state.mateo === 'Deposited' ? 3 : 0,
            expectedFrom: '2027-01-15',
            expectedTo: '2027-02-28',
            fields: fields(c, '459'),
            document: state.document && !state.document.sentAt ? state.document : null,
          },
        });
      if (step[2] === 'intake' && method === 'GET')
        return route.fulfill({
          json: {
            language: 'en',
            organization: ORG,
            explanation: `I already have ${c.firstName}’s name and date of birth from the enrolment. I’ll only ask for what’s missing: numbers go in the boxes, never in a message to me.`,
            childId: c.id,
            firstName: c.firstName,
            childName: `${c.firstName} ${c.lastName}`,
            dateOfBirth: c.born,
            taxYear: 2025,
            guardianSin: '212',
            childSin: state.sofia.childSin,
            taxFiled: state.taxFiled,
            recordFixRequested: false,
          },
        });
      if (step[2] === 'pause') {
        state.sofia.paused = 'NeedsSin';
        return route.fulfill({ status: 204 });
      }
      if (step[2] === 'reminder') state.sofia.reminder = req.postDataJSON().remind;
      if (step[2] === 'estimate')
        return route.fulfill({
          json: {
            language: 'en',
            organization: ORG,
            explanation: `I worked this out from ${c.firstName}’s birth year with the Government of Canada’s rules. It isn’t a promise: the Government confirms it from your tax returns.`,
            childId: c.id,
            firstName: c.firstName,
            amount: c.amount,
            ruleVersion: 1,
            bornBefore2004: false,
            needsTaxReturn: state.taxFiled !== 'Yes',
          },
        });
      const tax = state.taxFiled !== 'Yes';
      const reason = tax ? 'NeedsTaxReturn' : 'NeedsSin';
      const reminder = tax ? null : state.sofia.reminder;
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          explanation: tax
            ? 'The Learning Bond needs last year’s tax return. Free tax clinics can file it for you; here’s where to find one. Everything else is kept.'
            : `${c.firstName} needs a social insurance number for the Learning Bond. You can apply for free through Service Canada; here’s the link. Everything you gave me is kept.`,
          childId: c.id,
          firstName: c.firstName,
          status: 'Paused',
          reason,
          helpLink: tax
            ? 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/community-volunteer-income-tax-program/need-a-hand-complete-your-tax-return.html'
            : 'https://www.canada.ca/en/employment-social-development/services/sin/apply.html',
          resumeStep: tax ? 'estimate' : 'intake',
          reminder,
          reminderDates: reminder ? ['2026-11-19', '2026-12-05'] : [],
        },
      });
    }
    const doc = rest.match(/^\/documents\/([^/]+)\/(file|send)$/);
    if (doc && state.document) {
      if (doc[2] === 'file') {
        const head = (req.postDataBuffer() ?? Buffer.alloc(0)).subarray(0, 600).toString('latin1');
        state.document.fileName = /filename="([^"]+)"/.exec(head)?.[1] ?? 'document.pdf';
        return route.fulfill({ json: { id: state.document.id, fileName: state.document.fileName } });
      }
      state.document.sentAt = '2026-11-12T15:00:00Z';
      return route.fulfill({ status: 202, json: { id: state.document.id, sentAt: state.document.sentAt } });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const link = (demo, name) => app(demo).getByRole('link', { name, exact: true });
const SENT = `Sent to ${PROVIDER} on Thu 5 Nov 2026`;

export default [
  {
    // After Submit: what was sent and what comes next; Northfield received it.
    name: 'sent-phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/submitted`, { ready: false });
      await heading(demo, SENT);
      demo.mark();
      await demo.pause(3000);
      await shot(demo, 'phone-submitted');
      await app(demo).getByTestId('next-steps').scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'phone-next-steps');
      await app(demo).getByTestId('sent-fields').scrollIntoViewIfNeeded();
      await demo.pause(2400);
      state.mateo = 'Received';
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/submitted`, { ready: false });
      await app(demo).getByTestId('progress-notice').waitFor();
      await demo.pause(3000);
      await shot(demo, 'phone-received');
    },
  },
  {
    // Northfield needs proof of address: Carmen chooses the bill and sends it; later the deposit lands.
    name: 'document-phone',
    phone: true,
    run: async (demo) => {
      const state = newState({ mateo: 'Received', document: { id: 'doc-1', name: 'proof of address', fileName: null, sentAt: null } });
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/submitted`, { ready: false });
      await app(demo).getByTestId('document-request').waitFor();
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'phone-document-needed');
      await app(demo).getByTestId('document-request').scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await app(demo)
        .getByTestId('document-request')
        .locator('input[type=file]')
        .setInputFiles({ name: 'hydro-bill-oct.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 bill') });
      await app(demo).getByText('Chosen: hydro-bill-oct.pdf').waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-document-chosen');
      await demo.click(button(demo, `Send to ${PROVIDER}`));
      await app(demo).getByTestId('document-sent').waitFor();
      await demo.pause(2600);
      await shot(demo, 'phone-document-sent');
      state.mateo = 'Deposited';
      state.document = null;
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/submitted`, { ready: false });
      await app(demo).getByTestId('progress-notice').waitFor();
      await demo.pause(3200);
      await shot(demo, 'phone-deposited');
      await app(demo).getByTestId('next-steps').scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'phone-deposited-steps');
    },
  },
  {
    // Sofía has no SIN yet: the claim pauses with how to get one and a reminder; Carmen reopens the link and picks up at Sofía's details.
    name: 'paused-phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-sofia/intake`, { ready: false });
      await heading(demo, 'Sofía’s details');
      demo.mark();
      const none = button(demo, 'Sofía doesn’t have a SIN yet');
      await none.scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await shot(demo, 'phone-no-sin-yet');
      await demo.click(none);
      await heading(demo, 'Sofía’s claim is paused');
      await demo.pause(3200);
      await shot(demo, 'phone-paused');
      const yes = app(demo).getByRole('radio', { name: 'Yes, text me' });
      await yes.scrollIntoViewIfNeeded();
      await demo.pause(1400);
      await demo.click(yes);
      await demo.click(button(demo, 'Save'));
      await app(demo).getByTestId('reminder-saved').waitFor();
      await demo.pause(2600);
      await shot(demo, 'phone-reminder-set');
      await demo.go(`/g/learning-bond/${TOKEN}`, { ready: false });
      await app(demo).getByTestId('learning-bond-children').waitFor();
      await app(demo).getByTestId('learning-bond-children').scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'phone-reopened');
      await demo.click(app(demo).getByTestId('learning-bond-children').getByRole('listitem').filter({ hasText: 'Sofía' }).getByRole('link', { name: 'Pick up where you left off' }));
      await heading(demo, 'Sofía’s claim is paused');
      await demo.click(link(demo, 'Continue with Sofía’s details'));
      await heading(demo, 'Sofía’s details');
      await demo.pause(2800);
      await shot(demo, 'phone-resumed');
    },
  },
  {
    // On a laptop: the submitted page, and a claim paused for a tax return with the free clinic finder.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState({ mateo: 'Received' });
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/submitted`, { ready: false });
      await heading(demo, SENT);
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-submitted');
      state.taxFiled = 'No';
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-sofia/estimate`, { ready: false });
      await app(demo).getByTestId('estimate-tax-return').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-no-tax-return');
      await demo.click(link(demo, 'What to do now'));
      await heading(demo, 'Sofía’s claim is paused');
      await demo.pause(2800);
      await shot(demo, 'desktop-paused-tax');
    },
  },
];
