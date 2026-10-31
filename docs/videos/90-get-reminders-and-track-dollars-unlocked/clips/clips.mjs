// Screen recordings and screenshots for video 90, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: after her benefits check Carmen Rivera reads her reminders (taxes, renewals, birthdays) and turns one off;
// then her family page shows what is unlocked so far, and her total splits it by child and stream (L2-157, L2-158).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const TOKEN = 'tok-lb-rivera';
const REMINDERS = [
  { id: 'r-taxes', kind: 'Taxes', subject: '2026', dueOn: '2027-03-15', eventOn: '2027-03-15', turnedOff: false },
  { id: 'r-ccb', kind: 'Renewal', subject: 'Canada Child Benefit', dueOn: '2027-07-01', eventOn: '2027-07-01', turnedOff: false },
  { id: 'r-ocb', kind: 'Renewal', subject: 'Ontario Child Benefit', dueOn: '2027-07-01', eventOn: '2027-07-01', turnedOff: false },
  { id: 'r-sofia', kind: 'TurnsEighteen', subject: 'Sofía', dueOn: '2032-05-03', eventOn: '2032-06-02', turnedOff: false },
  { id: 'r-mateo', kind: 'TurnsEighteen', subject: 'Mateo', dueOn: '2035-02-12', eventOn: '2035-03-14', turnedOff: false },
];
const LINES = [
  { child: 'Mateo', stream: 'Learning Bond', amount: 1400, confirmed: true },
  { child: 'Sofía', stream: 'Learning Bond', amount: 1700, confirmed: false },
  { child: 'Mateo', stream: 'Ontario Child Benefit', amount: 840, confirmed: true },
  { child: 'Sofía', stream: 'Ontario Child Benefit', amount: 840, confirmed: true },
];

/** The guardian endpoints for reminders and the total, as the real API answers them (LearningBondRemindersHandler, LearningBondTotalHandler). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === `/api/g/learning-bond/${TOKEN}`) return route.fulfill({ json: { organization: ORG, language: 'en' } });
    const rest = path.slice(`/api/g/learning-bond/${TOKEN}`.length);
    if (rest === '/reminders') return route.fulfill({ json: { language: 'en', organization: ORG, reminders: state.reminders } });
    const off = rest.match(/^\/reminders\/([^/]+)\/off$/);
    if (off) {
      state.reminders.find((r) => r.id === off[1]).turnedOff = true;
      return route.fulfill({ status: 204 });
    }
    if (rest === '/total') {
      const confirmed = state.lines.filter((l) => l.confirmed).reduce((s, l) => s + l.amount, 0);
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          confirmed,
          estimated: state.lines.filter((l) => !l.confirmed).reduce((s, l) => s + l.amount, 0),
          nothingConfirmed: confirmed === 0,
          lines: state.lines,
        },
      });
    }
    if (rest === '/page')
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          phone: '905-555-0100',
          explanation: `The Canada Learning Bond is money the Government of Canada puts in a child’s RESP for families with lower incomes. You don’t need to put in any money. What you enter goes to the RESP provider and the Government of Canada, not to ${ORG}.`,
          children: [
            { id: 'c-mateo', firstName: 'Mateo', age: 9, programs: ['After‑School Tutoring'], amount: 1400, selfClaim: false, claim: 'Deposited' },
            { id: 'c-sofia', firstName: 'Sofía', age: 12, programs: ['After‑School Tutoring'], amount: 1700, selfClaim: false, claim: 'Submitted' },
          ],
          status: 'Invited',
          consents: [],
          benefits: { offered: false, consented: true },
        },
      });
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

export default [
  {
    // The reminders and Turn off.
    name: 'reminders-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { reminders: structuredClone(REMINDERS), lines: LINES });
      await demo.go(`/g/learning-bond/${TOKEN}/reminders`, { ready: false });
      await heading(demo, 'Your reminders');
      demo.mark();
      await demo.pause(3200);
      await shot(demo, 'phone-reminders');
      const off = app(demo).getByRole('button', { name: 'Turn off Ontario Child Benefit renews' });
      await off.scrollIntoViewIfNeeded();
      await demo.pause(1800);
      await demo.click(off);
      await app(demo).getByTestId('reminders').getByText('Off', { exact: true }).waitFor();
      await demo.pause(2600);
      await shot(demo, 'phone-reminder-off');
    },
  },
  {
    // The family page's total card, then the total by child and stream.
    name: 'total-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { reminders: structuredClone(REMINDERS), lines: LINES });
      await demo.go(`/g/learning-bond/${TOKEN}`, { ready: false });
      await app(demo).getByTestId('learning-bond-total').waitFor();
      demo.mark();
      await app(demo).getByTestId('learning-bond-total').scrollIntoViewIfNeeded();
      await demo.pause(3000);
      await shot(demo, 'phone-total-card');
      await demo.click(app(demo).getByTestId('learning-bond-total').getByRole('link', { name: 'See your total' }));
      await heading(demo, 'Your total');
      await demo.pause(3600);
      await shot(demo, 'phone-total');
    },
  },
  {
    // On a laptop: the total, and nothing confirmed yet.
    name: 'total-desktop',
    run: async (demo) => {
      const state = { reminders: [], lines: LINES };
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/total`, { ready: false });
      await heading(demo, 'Your total');
      demo.mark();
      await demo.pause(3200);
      await shot(demo, 'desktop-total');
      state.lines = [{ child: 'Mateo', stream: 'Learning Bond', amount: 1400, confirmed: false }];
      await demo.go(`/g/learning-bond/${TOKEN}/total`, { ready: false });
      await app(demo).getByText('Nothing confirmed yet').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-nothing-confirmed');
      await demo.go(`/g/learning-bond/${TOKEN}/reminders`, { ready: false });
      await app(demo).getByText('No reminders').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-no-reminders');
    },
  },
];
