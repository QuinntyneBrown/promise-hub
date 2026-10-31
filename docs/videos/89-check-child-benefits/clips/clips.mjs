// Screen recordings and screenshots for video 89, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: on Mateo's confirmation Carmen Rivera is offered the benefits check, gives its own consent, answers three
// questions and sees each benefit with one state; she applies for the Ontario Child Benefit on its own, then uploads proof of address for
// Hamilton Recreation Assistance, whose filled form she sends herself (L2-153 to L2-156). No full SIN appears anywhere.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const TOKEN = 'tok-lb-rivera';
const WORDING =
  'I agree that Learning Bond may use what I’ve already given, plus my household size, marital status and whether I get the Canada Child Benefit, to check and apply for child benefits I choose.';
const CATALOGUE = [
  { key: 'canada-child-benefit', name: 'Canada Child Benefit', level: 'Federal', amount: 13496, channel: 'Electronic', source: 'Canada Revenue Agency', document: null },
  { key: 'ontario-child-benefit', name: 'Ontario Child Benefit', level: 'Provincial', amount: 1680, channel: 'Electronic', source: 'Ontario Ministry of Children, Community and Social Services', document: null },
  { key: 'hamilton-recreation-assistance', name: 'Hamilton Recreation Assistance', level: 'Municipal', amount: null, channel: 'Form', source: 'City of Hamilton', document: 'proof of address' },
  { key: 'child-disability-benefit', name: 'Child Disability Benefit', level: 'Federal', amount: 6822, channel: 'Electronic', source: 'Canada Revenue Agency', document: null },
];

const newState = (x = {}) => ({ consented: false, dismissed: false, answers: null, apps: {}, ...x });
const ANSWERED = { householdSize: 3, maritalStatus: 'Single', ccbNow: 'Yes', incomeChanged: 'No' };

/** The guardian endpoints the benefits check uses, as the real API answers them (LearningBondBenefitsHandler, LearningBondBenefitApplicationHandler). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    if (path === `/api/g/learning-bond/${TOKEN}`) return route.fulfill({ json: { organization: ORG, language: 'en' } });
    const rest = path.slice(`/api/g/learning-bond/${TOKEN}`.length);
    const app = (key) => (state.apps[key] ??= { id: `benefit-${key}`, address: null, reviewVersion: 1, status: 'Draft', documentFile: null });
    const review = (key) => {
      const e = CATALOGUE.find((x) => x.key === key);
      const a = app(key);
      return {
        id: a.id,
        language: 'en',
        organization: ORG,
        explanation:
          e.channel === 'Form'
            ? `${e.name} takes this one on paper or by email. I filled in the form; you send it, then tell me.`
            : 'I filled this in from what you’ve given. Check each field; nothing is sent until you tap Submit.',
        benefitKey: key,
        program: e.name,
        channel: e.channel,
        status: a.status,
        reviewVersion: a.reviewVersion,
        amount: e.amount,
        documentFile: a.documentFile,
        sendTo: e.channel === 'Form' ? 'recassist@hamilton.example or 71 Main St W, Hamilton' : null,
        fields: {
          applicantName: 'Carmen Rivera',
          applicantSin: '212',
          maritalStatus: 'Single',
          householdSize: '3',
          children: 'Mateo (2017-03-14), Sofía (2014-06-02)',
          address: a.address,
          phone: '905-555-0142',
          email: 'carmen.rivera@example.com',
          canadaChildBenefit: 'Receiving',
          program: e.name,
        },
      };
    };
    if (rest === '/children/c-mateo/progress')
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          explanation: 'Done. Northfield Credit Union has the application. I’ll text you at each step; there’s nothing else for you to do now.',
          applicationId: 'app-mateo',
          childId: 'c-mateo',
          firstName: 'Mateo',
          provider: 'Northfield Credit Union',
          status: 'Submitted',
          submittedAt: '2026-11-05T21:12:00Z',
          estimate: 1400,
          depositAmount: null,
          stepsDone: 0,
          expectedFrom: '2027-01-15',
          expectedTo: '2027-02-28',
          fields: {
            beneficiaryName: 'Mateo Rivera',
            dateOfBirth: '2017-03-14',
            childSin: '459',
            caregiverName: 'Carmen Rivera',
            address: '42 Barton St E, Apt 3, Hamilton ON L8L 2V6',
            guardianSin: '212',
            phone: '905-555-0142',
            email: 'carmen.rivera@example.com',
            language: 'Spanish',
          },
          document: null,
          benefitsOffer: !state.consented && !state.dismissed,
        },
      });
    if (rest === '/benefits/consent') return route.fulfill({ json: { language: 'en', organization: ORG, wording: WORDING, wordingVersion: 1, given: state.consented } });
    if (rest === '/consents') {
      state.consented = true;
      return route.fulfill({ status: 201, json: { ids: [] } });
    }
    if (rest === '/benefits/intake' && method === 'GET')
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          explanation: 'I’ll reuse Mateo and Sofía’s details, your SIN and your tax answer. I need at most three more facts.',
          children: [
            { id: 'c-mateo', firstName: 'Mateo', age: 9, claims: null },
            { id: 'c-sofia', firstName: 'Sofía', age: 12, claims: null },
          ],
          sinGiven: true,
          taxAnswered: true,
          householdSize: null,
          maritalStatus: null,
          ccbNow: null,
          incomeChanged: null,
        },
      });
    if (rest === '/benefits/intake') {
      state.answers = req.postDataJSON();
      return route.fulfill({ status: 204 });
    }
    if (rest === '/benefits')
      return route.fulfill({
        json: {
          language: 'en',
          organization: ORG,
          explanation: 'Here’s what Hamilton, Ontario and Canada likely owe your family. Apply to each one on its own; I never send anything for you.',
          benefits: CATALOGUE.map((e) => {
            const a = state.apps[e.key];
            const state_ =
              a && ['Submitted', 'MarkedSent'].includes(a.status)
                ? 'Submitted'
                : e.key === 'canada-child-benefit'
                  ? 'AlreadyGet'
                  : e.key === 'child-disability-benefit'
                    ? 'NotEligible'
                    : e.document && !a?.documentFile
                      ? 'NeedDocument'
                      : 'ApplyNow';
            return {
              key: e.key,
              name: e.name,
              level: e.level,
              amount: e.amount,
              state: state_,
              reason: state_ === 'NotEligible' ? 'Neither Mateo nor Sofía has an approved Disability Tax Credit certificate.' : null,
              document: e.document,
              documentFile: a?.documentFile ?? null,
              channel: e.channel,
              source: e.source,
              sourceLink: 'https://www.canada.ca/',
              ruleVersion: e.level === 'Municipal' ? '2026-03' : '2026-07',
              applicationId: a?.id ?? null,
            };
          }),
          blocked: [],
          incomeNote: null,
          localNote: null,
          allReceived: false,
        },
      });
    const doc = rest.match(/^\/benefits\/([a-z-]+)\/document$/);
    if (doc) {
      const head = (req.postDataBuffer() ?? Buffer.alloc(0)).subarray(0, 600).toString('latin1');
      app(doc[1]).documentFile = /filename="([^"]+)"/.exec(head)?.[1] ?? 'document.pdf';
      return route.fulfill({ json: { id: 'doc', fileName: app(doc[1]).documentFile } });
    }
    const prepare = rest.match(/^\/benefits\/([a-z-]+)\/applications$/);
    if (prepare) return route.fulfill({ json: review(prepare[1]) });
    const act = rest.match(/^\/benefits\/applications\/benefit-([a-z-]+)\/(fields\/[a-z]+|submit|sent|form)$/);
    if (act) {
      const a = app(act[1]);
      if (act[2] === 'form') return route.fulfill({ contentType: 'application/pdf', body: Buffer.from('%PDF-1.4\n%%EOF\n') });
      if (act[2] === 'sent') {
        a.status = 'MarkedSent';
        return route.fulfill({ status: 204 });
      }
      if (act[2] === 'submit') {
        a.status = 'Submitted';
        return route.fulfill({ status: 202, json: { id: a.id, status: 'Submitted' } });
      }
      a.address = req.postDataJSON().value;
      a.reviewVersion++;
      a.status = 'ReadyToSubmit';
      return route.fulfill({ json: review(act[1]) });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const card = (demo, name) => app(demo).getByTestId('benefit-card').filter({ hasText: name });

export default [
  {
    // The offer, the Benefits consent, three questions and the list.
    name: 'check-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState());
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/submitted`, { ready: false });
      await app(demo).getByTestId('benefits-offer').waitFor();
      demo.mark();
      await app(demo).getByTestId('benefits-offer').scrollIntoViewIfNeeded();
      await demo.pause(3000);
      await shot(demo, 'phone-offer');
      await demo.click(app(demo).getByTestId('benefits-offer').getByRole('link', { name: 'Check benefits' }));
      await heading(demo, 'Your permission for the benefits check');
      await demo.pause(2600);
      await demo.click(app(demo).getByRole('checkbox'));
      await demo.type(app(demo).getByLabel('Type your full name to sign'), 'Carmen Rivera');
      await shot(demo, 'phone-consent');
      await demo.click(button(demo, 'Agree'));
      await heading(demo, 'Three questions');
      await demo.pause(2200);
      await demo.type(app(demo).getByLabel('How many people live with you, including you and your children?'), '3');
      await app(demo).getByLabel('Your marital status').selectOption({ label: 'Single' });
      await demo.click(app(demo).getByRole('group', { name: 'Do you get the Canada Child Benefit now?' }).getByRole('radio', { name: 'Yes', exact: true }));
      await demo.click(app(demo).getByRole('group', { name: 'Has your income changed a lot since your last tax return?' }).getByRole('radio', { name: 'No', exact: true }));
      await demo.pause(1200);
      await shot(demo, 'phone-questions');
      await demo.click(button(demo, 'Check my benefits'));
      await heading(demo, 'Your family’s benefits');
      await demo.pause(3200);
      await shot(demo, 'phone-benefits');
      await card(demo, 'Hamilton Recreation Assistance').scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await card(demo, 'Child Disability Benefit').scrollIntoViewIfNeeded();
      await demo.pause(2600);
      await shot(demo, 'phone-not-eligible');
      await app(demo).getByTestId('benefits-already').scrollIntoViewIfNeeded();
      await demo.pause(2400);
    },
  },
  {
    // Apply now for the Ontario Child Benefit: the address, Submit, only this one.
    name: 'apply-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState({ consented: true, answers: ANSWERED }));
      await demo.go(`/g/learning-bond/${TOKEN}/benefits/ontario-child-benefit`, { ready: false });
      await heading(demo, 'Check your Ontario Child Benefit application');
      demo.mark();
      await demo.pause(2800);
      await shot(demo, 'phone-ocb-review');
      const edit = button(demo, 'Edit Address');
      await edit.scrollIntoViewIfNeeded();
      await demo.click(edit);
      await app(demo).getByRole('dialog').waitFor();
      await demo.type(app(demo).getByRole('dialog').getByLabel('Address', { exact: true }), '42 Barton St E, Apt 3, Hamilton ON L8L 2V6');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Save' }));
      await app(demo).getByRole('dialog').waitFor({ state: 'detached' });
      const submit = button(demo, 'Submit to Ontario Child Benefit');
      await submit.scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await demo.click(submit);
      await app(demo).getByTestId('benefit-sent').waitFor();
      await demo.pause(3000);
      await shot(demo, 'phone-ocb-sent');
    },
  },
  {
    // On a laptop: proof of address for Hamilton, then the form Carmen sends herself.
    name: 'form-desktop',
    run: async (demo) => {
      await fakeApi(demo, newState({ consented: true, answers: ANSWERED }));
      await demo.go(`/g/learning-bond/${TOKEN}/benefits`, { ready: false });
      await heading(demo, 'Your family’s benefits');
      demo.mark();
      await demo.pause(2400);
      await shot(demo, 'desktop-benefits');
      await card(demo, 'Hamilton Recreation Assistance').scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await card(demo, 'Hamilton Recreation Assistance')
        .locator('input[type=file]')
        .setInputFiles({ name: 'hydro-bill-oct.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7 bill') });
      await card(demo, 'Hamilton Recreation Assistance').getByRole('link', { name: 'Apply now' }).waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-document-uploaded');
      await demo.click(card(demo, 'Hamilton Recreation Assistance').getByRole('link', { name: 'Apply now' }));
      await heading(demo, 'Hamilton Recreation Assistance');
      await demo.pause(3000);
      await shot(demo, 'desktop-form');
      await demo.click(button(demo, 'Mark as sent'));
      await app(demo).getByTestId('benefit-sent').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-marked-sent');
    },
  },
];
