// Screen recordings and screenshots for video 88, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: Carmen Rivera opens her Learning Bond link, finds Your consents, withdraws consent for Mateo after the
// dialog says what stops and what stays with Northfield, and later gives consent again, so Mateo's details start from the first question
// (L2-152, L2-159). No full SIN appears anywhere.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const TOKEN = 'tok-lb-rivera';
const CHILDREN = [
  { id: 'c-mateo', firstName: 'Mateo', lastName: 'Rivera', born: '2017-03-14', age: 9, amount: 1400 },
  { id: 'c-sofia', firstName: 'Sofía', lastName: 'Rivera', born: '2014-06-02', age: 12, amount: 1700 },
];
const wording = (child) =>
  `I agree that Learning Bond may collect ${child}’s and my social insurance numbers and tax-filing status and send them to the RESP provider I choose and the Government of Canada to apply for the Canada Learning Bond.`;

// Mateo's consent is in force and his application went to Northfield; withdrawing destroys what is kept here.
const newState = () => ({ consented: ['c-mateo'], kept: true, sent: true });

/** The guardian Learning Bond endpoints as the real API answers them (the page with Your consents, withdrawal, consent and intake). */
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
          children: CHILDREN.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            age: c.age,
            programs: ['After‑School Tutoring'],
            amount: c.amount,
            selfClaim: false,
            claim: state.consented.includes(c.id) ? (c.id === 'c-mateo' && state.sent ? 'Submitted' : 'Started') : null,
          })),
          status: 'Invited',
          consents: state.consented.map((id) => ({
            id: `consent-${id}`,
            childId: id,
            firstName: CHILDREN.find((c) => c.id === id).firstName,
            typedName: 'Carmen Rivera',
            givenAt: '2026-11-05T21:08:00Z',
            wordingVersion: 1,
            provider: id === 'c-mateo' && state.sent ? 'Northfield Credit Union' : null,
            sent: id === 'c-mateo' && state.sent,
          })),
        },
      });
    const withdraw = rest.match(/^\/consents\/consent-([^/]+)$/);
    if (withdraw && method === 'DELETE') {
      state.consented = state.consented.filter((id) => id !== withdraw[1]);
      state.kept = false;
      state.sent = false;
      return route.fulfill({ status: 204 });
    }
    if (rest === '/consent')
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          explanation: `Before I ask anything, I need your permission for each child. It’s separate from the program consent you gave ${ORG}.`,
          wordingVersion: 1,
          children: CHILDREN.filter((c) => !state.consented.includes(c.id)).map((c) => ({ id: c.id, firstName: c.firstName, wording: wording(c.firstName) })),
        },
      });
    if (rest === '/consents') {
      state.consented.push(...req.postDataJSON().childIds);
      return route.fulfill({ status: 201, json: { ids: [] } });
    }
    const intake = rest.match(/^\/children\/([^/]+)\/intake$/);
    if (intake) {
      const c = CHILDREN.find((x) => x.id === intake[1]);
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
          guardianSin: state.kept ? '212' : null,
          childSin: state.kept ? '459' : null,
          taxFiled: state.kept ? 'Yes' : null,
          recordFixRequested: false,
        },
      });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });

export default [
  {
    // Your consents, the dialog, the withdrawal.
    name: 'withdraw-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go(`/g/learning-bond/${TOKEN}`, { ready: false });
      await app(demo).getByTestId('learning-bond-consents').waitFor();
      demo.mark();
      await app(demo).getByTestId('learning-bond-consents').scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'phone-your-consents');
      await demo.click(button(demo, 'Withdraw consent for Mateo'));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(4200);
      await shot(demo, 'phone-withdraw-dialog');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Withdraw consent' }));
      await app(demo).getByTestId('consent-withdrawn').waitFor();
      await app(demo).getByTestId('consent-withdrawn').scrollIntoViewIfNeeded();
      await demo.pause(3200);
      await shot(demo, 'phone-withdrawn');
    },
  },
  {
    // Later, consent again: Mateo's details start from the first question.
    name: 'again-phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      state.consented = [];
      state.kept = false;
      state.sent = false;
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/consent`, { ready: false });
      await heading(demo, 'Your permission, for each child');
      demo.mark();
      await demo.pause(2000);
      await demo.click(app(demo).getByRole('checkbox', { name: /^I agree that Learning Bond may collect Mateo’s/ }));
      await demo.type(app(demo).getByLabel('Type your full name to sign'), 'Carmen Rivera');
      await demo.click(button(demo, 'Agree'));
      await app(demo).getByTestId('consent-recorded').waitFor();
      await demo.pause(1600);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/intake`, { ready: false });
      await heading(demo, 'Mateo’s details');
      await app(demo).getByLabel('Your SIN', { exact: true }).scrollIntoViewIfNeeded();
      await demo.pause(3200);
      await shot(demo, 'phone-intake-again');
    },
  },
  {
    // The dialog on a laptop.
    name: 'dialog-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go(`/g/learning-bond/${TOKEN}`, { ready: false });
      await app(demo).getByTestId('learning-bond-consents').waitFor();
      demo.mark();
      await app(demo).getByTestId('learning-bond-consents').scrollIntoViewIfNeeded();
      await demo.pause(2000);
      await shot(demo, 'desktop-your-consents');
      await demo.click(button(demo, 'Withdraw consent for Mateo'));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(3600);
      await shot(demo, 'desktop-withdraw-dialog');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Cancel' }));
      await demo.pause(1600);
    },
  },
];
