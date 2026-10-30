// Screen recordings and screenshots for video 86, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: Carmen Rivera taps her Learning Bond link on a new phone, enters the texted code, reads what the Learning
// Bond is and gives consent for Mateo; her SIN and Mateo's are already given and shown only as their last three digits, she answers the
// tax question, sees Mateo's estimate, adds her address on the review and submits to Northfield Credit Union; her family page then says
// it was sent. Then the page in Spanish, a provider that doesn't answer, no provider for the province and a family with no tax return
// (L2-144 to L2-149). No full SIN appears anywhere.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const TOKEN = 'tok-lb-rivera';
const CODE = '482913';
const CHILDREN = [
  { id: 'c-mateo', firstName: 'Mateo', lastName: 'Rivera', born: '2017-03-14', age: 9, amount: 1400 },
  { id: 'c-sofia', firstName: 'Sofía', lastName: 'Rivera', born: '2014-06-02', age: 12, amount: 1700 },
];
const PROVIDERS = [
  ['Northfield Credit Union', ['ON', 'MB', 'SK', 'AB', 'BC']],
  ['Maple Trust RESP', ['NL', 'PE', 'NS', 'NB', 'QC', 'ON', 'MB', 'SK', 'AB', 'BC', 'YT', 'NT']],
];
const REASON = 'No fees, no deposit needed, and it handles the Learning Bond';

const WELCOME = {
  en: `The Canada Learning Bond is money the Government of Canada puts in a child’s RESP for families with lower incomes. You don’t need to put in any money. What you enter goes to the RESP provider and the Government of Canada, not to ${ORG}.`,
  es: `El Bono de Estudios Canadiense es dinero que el Gobierno de Canadá deposita en el RESP de un niño para familias con ingresos más bajos. No tiene que aportar dinero. Lo que escriba va al proveedor del RESP y al Gobierno de Canadá, no a ${ORG}.`,
};
const CONSENT = {
  en: `Before I ask anything, I need your permission for each child. It’s separate from the program consent you gave ${ORG}.`,
  es: `Antes de preguntar nada, necesito su permiso por cada hijo. Es distinto del consentimiento del programa que dio a ${ORG}.`,
};
const wording = (lang, child) =>
  lang === 'es'
    ? `Acepto que Learning Bond recopile los números de seguro social de ${child} y míos y nuestra situación fiscal, y los envíe al proveedor de RESP que yo elija y al Gobierno de Canadá para solicitar el Bono de Estudios Canadiense.`
    : `I agree that Learning Bond may collect ${child}’s and my social insurance numbers and tax-filing status and send them to the RESP provider I choose and the Government of Canada to apply for the Canada Learning Bond.`;

const newState = (x = {}) => ({
  language: 'en',
  trusted: true,
  consents: [],
  // The household's intake: the last three digits of Carmen's SIN and the tax answer; per child, the last three digits of theirs.
  guardianLast3: null,
  childLast3: {},
  taxFiled: null,
  application: null,
  province: 'ON',
  providerFails: false,
  ...x,
});

/** The guardian Learning Bond endpoints as the real API answers them (LearningBondGuardianHandler and the claim handlers). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    const body = () => req.postDataJSON() ?? {};
    if (path === '/api/g/auth/code') return route.fulfill({ status: 204 });
    if (path === '/api/g/auth/verify') {
      if (body().code !== CODE) return route.fulfill({ status: 422, json: { errors: { code: 'That code didn’t match. Check the text and try again.' } } });
      state.trusted = true;
      return route.fulfill({ status: 204 });
    }
    if (path === `/api/g/learning-bond/${TOKEN}`) return route.fulfill({ json: { organization: ORG, language: state.language } });
    if (path.startsWith(`/api/g/learning-bond/${TOKEN}/`) || path === `/api/g/home/${TOKEN}`) {
      if (!state.trusted)
        return route.fulfill({ status: 401, json: { code: 'verification-required', language: state.language, organization: ORG, phone: '905-555-0100', contacts: ['•••-•••-0142', '•••-•••-0199'] } });
    }
    const rest = path.slice(`/api/g/learning-bond/${TOKEN}`.length);
    const child = (id) => CHILDREN.find((c) => c.id === id);
    if (path === `/api/g/home/${TOKEN}`) return route.fulfill({ json: home(state) });
    if (rest === '/page')
      return route.fulfill({
        json: {
          language: state.language,
          organization: ORG,
          phone: '905-555-0100',
          explanation: WELCOME[state.language],
          children: CHILDREN.map((c) => ({ id: c.id, firstName: c.firstName, age: c.age, programs: ['After‑School Tutoring'], amount: c.amount, selfClaim: false })),
          status: 'Invited',
        },
      });
    if (rest === '/consent')
      return route.fulfill({
        json: {
          language: state.language,
          organization: ORG,
          explanation: CONSENT[state.language],
          wordingVersion: 1,
          children: CHILDREN.filter((c) => !state.consents.includes(c.id)).map((c) => ({ id: c.id, firstName: c.firstName, wording: wording(state.language, c.firstName) })),
        },
      });
    if (rest === '/consents') {
      const b = body();
      const errors = {};
      if (!b.childIds?.length) errors.children = 'Tick at least one child.';
      if (!b.typedName?.trim()) errors.typedName = 'Type your full name to sign.';
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      state.consents.push(...b.childIds);
      return route.fulfill({ status: 201, json: { ids: b.childIds.map((id) => `consent-${id}`) } });
    }
    const step = rest.match(/^\/children\/([^/]+)\/(intake|estimate|applications)$/);
    if (step) {
      const c = child(step[1]);
      if (step[2] === 'intake' && method === 'GET')
        return route.fulfill({
          json: {
            language: state.language,
            organization: ORG,
            explanation: `I already have ${c.firstName}’s name and date of birth from the enrolment. I’ll only ask for what’s missing: numbers go in the boxes, never in a message to me.`,
            childId: c.id,
            firstName: c.firstName,
            childName: `${c.firstName} ${c.lastName}`,
            dateOfBirth: c.born,
            taxYear: 2025,
            guardianSin: state.guardianLast3,
            childSin: state.childLast3[c.id] ?? null,
            taxFiled: state.taxFiled,
            recordFixRequested: false,
          },
        });
      if (step[2] === 'intake') {
        if (body().taxFiled) state.taxFiled = body().taxFiled;
        return route.fulfill({ status: 204 });
      }
      if (step[2] === 'estimate')
        return route.fulfill({
          json: {
            language: state.language,
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
      if (!state.application) {
        const provider = PROVIDERS.find(([, p]) => p.includes(state.province))?.[0] ?? null;
        state.application = { id: `app-${c.id}`, childId: c.id, provider, phone: '905-555-0142', email: 'carmen.rivera@example.com', address: null, reviewVersion: 1, status: 'Draft' };
      }
      return route.fulfill({ json: review(state) });
    }
    const app = rest.match(/^\/applications\/([^/]+)\/(fields\/[a-z]+|provider|submit)$/);
    if (app) {
      const a = state.application;
      if (app[2] === 'submit') {
        if (a.status === 'Submitted') return route.fulfill({ status: 202, json: { id: a.id, status: 'Submitted' } });
        if (state.providerFails) return route.fulfill({ status: 502, json: { code: 'not-sent' } });
        if (a.status !== 'ReadyToSubmit') return route.fulfill({ status: 409, json: { code: 'incomplete' } });
        a.status = 'Submitted';
        return route.fulfill({ status: 202, json: { id: a.id, status: 'Submitted' } });
      }
      if (app[2] === 'provider') a.provider = body().name;
      else a[app[2].slice('fields/'.length)] = body().value.trim();
      a.reviewVersion++;
      a.status = a.address && a.provider ? 'ReadyToSubmit' : 'Draft';
      return route.fulfill({ json: review(state) });
    }
    return route.fulfill({ status: 404 });
  });
}

function review(state) {
  const a = state.application;
  const c = CHILDREN.find((x) => x.id === a.childId);
  const serving = PROVIDERS.filter(([, p]) => p.includes(state.province)).map(([name]) => name);
  return {
    id: a.id,
    language: state.language,
    organization: ORG,
    explanation: `I filled in ${a.provider ?? PROVIDERS[0][0]}’s application from what I have. Check each field. Nothing has been sent yet; here’s exactly what goes, and to whom.`,
    childId: c.id,
    firstName: c.firstName,
    status: a.status,
    reviewVersion: a.reviewVersion,
    province: state.province,
    provider: a.provider,
    reason: REASON,
    providers: serving,
    noProvider: serving.length === 0,
    fields: {
      beneficiaryName: `${c.firstName} ${c.lastName}`,
      dateOfBirth: c.born,
      childSin: state.childLast3[c.id] ?? null,
      caregiverName: 'Carmen Rivera',
      address: a.address,
      guardianSin: state.guardianLast3,
      phone: a.phone,
      email: a.email,
      language: 'Spanish',
    },
  };
}

function home(state) {
  return {
    language: state.language,
    organization: ORG,
    phone: '905-555-0100',
    firstName: 'Carmen',
    children: CHILDREN.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      firstName: c.firstName,
      programs: ['After‑School Tutoring'],
      enrollments: [{ program: 'After‑School Tutoring', status: 'Enrolled', position: null, note: null, startsOn: '2026-09-08', schedule: 'Mon and Wed, 3:30 to 5:30 pm' }],
      pickups: null,
      allergies: null,
      medication: null,
    })),
    noShows: [],
    pickupRequests: [],
    announcements: null,
    contact: null,
    learningBond: { children: CHILDREN.map((c) => ({ id: c.id, firstName: c.firstName, status: state.application?.childId === c.id && state.application.status === 'Submitted' ? 'Submitted' : 'Invited' })) },
  };
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const button = (demo, name) => app(demo).getByRole('button', { name, exact: true });
const link = (demo, name) => app(demo).getByRole('link', { name, exact: true });
// The state after consent for Mateo, with both SINs given (kept as their last three digits) and the tax question still open.
const consented = (x = {}) => newState({ consents: ['c-mateo'], guardianLast3: '212', childLast3: { 'c-mateo': '459' }, ...x });

export default [
  {
    // The link on a new phone: the texted code, what the Learning Bond is, and consent for Mateo.
    name: 'link-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState({ trusted: false }));
      await demo.go(`/g/learning-bond/${TOKEN}`, { ready: false });
      await app(demo).getByRole('button', { name: 'Send the code' }).waitFor();
      demo.mark();
      await demo.pause(2200);
      await shot(demo, 'phone-code');
      await demo.type(app(demo).getByRole('textbox').first(), '905-555-0142');
      await demo.click(button(demo, 'Send the code'));
      await app(demo).getByRole('textbox').first().waitFor();
      await demo.pause(800);
      await demo.type(app(demo).getByRole('textbox').first(), CODE);
      await demo.click(button(demo, 'Continue'));
      await app(demo).getByTestId('learning-bond-children').waitFor();
      await demo.pause(3600);
      await shot(demo, 'phone-learning-bond');
      await app(demo).getByTestId('learning-bond-children').scrollIntoViewIfNeeded();
      await demo.pause(2400);
      await demo.click(link(demo, 'Continue'));
      await heading(demo, 'Your permission, for each child');
      await demo.pause(2800);
      await shot(demo, 'phone-consent');
      await demo.click(app(demo).getByRole('checkbox', { name: /^I agree that Learning Bond may collect Mateo’s/ }));
      await demo.type(app(demo).getByLabel('Type your full name to sign'), 'Carmen Rivera');
      await demo.click(button(demo, 'Agree'));
      await app(demo).getByTestId('consent-recorded').waitFor();
      await demo.pause(2800);
      await shot(demo, 'phone-consent-recorded');
    },
  },
  {
    // The details with both SINs masked, the tax question, the estimate, the review with an address added, and Submit.
    name: 'claim-phone',
    phone: true,
    run: async (demo) => {
      const state = consented();
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/intake`, { ready: false });
      await heading(demo, 'Mateo’s details');
      demo.mark();
      await demo.pause(3000);
      await shot(demo, 'phone-intake');
      const taxes = app(demo).getByRole('radio', { name: 'Yes', exact: true });
      await taxes.scrollIntoViewIfNeeded();
      await demo.pause(1400);
      await demo.click(taxes);
      await demo.click(button(demo, 'Save and continue'));
      await app(demo).getByTestId('intake-saved').waitFor();
      await demo.pause(1600);
      await demo.click(link(demo, 'See the estimate'));
      await heading(demo, 'Mateo may be owed up to $1,400.');
      await demo.pause(3600);
      await shot(demo, 'phone-estimate');
      await demo.click(link(demo, 'Review Mateo’s application'));
      await heading(demo, 'Check Mateo’s application');
      await demo.pause(3000);
      await shot(demo, 'phone-review');
      const edit = button(demo, 'Edit Address');
      await edit.scrollIntoViewIfNeeded();
      await demo.pause(1600);
      await demo.click(edit);
      await app(demo).getByRole('dialog').waitFor();
      await demo.type(app(demo).getByRole('dialog').getByLabel('Address', { exact: true }), '42 Barton St E, Apt 3, Hamilton ON L8L 2V6');
      await demo.pause(800);
      await shot(demo, 'phone-edit-address');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Save' }));
      await app(demo).getByRole('dialog').waitFor({ state: 'detached' });
      await demo.pause(1800);
      const submit = button(demo, 'Submit to Northfield Credit Union');
      await submit.scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await demo.click(submit);
      await app(demo).getByTestId('review-sent').waitFor();
      await demo.pause(3200);
      await shot(demo, 'phone-sent');
      await demo.go(`/g/home/${TOKEN}`, { ready: false });
      await heading(demo, 'Hi Carmen');
      const card = app(demo).getByRole('region', { name: 'Learning Bond' });
      await card.scrollIntoViewIfNeeded();
      await demo.pause(3200);
      await shot(demo, 'phone-home-card');
    },
  },
  {
    // The same link in Spanish, the household's language.
    name: 'spanish-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, newState({ language: 'es' }));
      await demo.go(`/g/learning-bond/${TOKEN}`, { ready: false });
      await app(demo).getByTestId('learning-bond-children').waitFor();
      demo.mark();
      await demo.pause(3600);
      await shot(demo, 'phone-learning-bond-es');
      await demo.click(link(demo, 'Continuar'));
      await app(demo).getByTestId('stepper').waitFor();
      await demo.pause(3000);
      await shot(demo, 'phone-consent-es');
    },
  },
  {
    // On a laptop: the review, Choose another, a provider that doesn't answer, no provider for the province and no tax return.
    name: 'states-desktop',
    run: async (demo) => {
      const state = consented({ taxFiled: 'Yes', providerFails: true });
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/review`, { ready: false });
      await heading(demo, 'Check Mateo’s application');
      demo.mark();
      await demo.pause(2600);
      await shot(demo, 'desktop-review');
      await demo.click(button(demo, 'Choose another'));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-choose-provider');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Cancel' }));
      await demo.click(button(demo, 'Edit Address'));
      await demo.type(app(demo).getByRole('dialog').getByLabel('Address', { exact: true }), '42 Barton St E, Apt 3, Hamilton ON L8L 2V6');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Save' }));
      await app(demo).getByRole('dialog').waitFor({ state: 'detached' });
      await demo.click(button(demo, 'Submit to Northfield Credit Union'));
      await app(demo).getByTestId('review-not-sent').waitFor();
      await app(demo).getByTestId('review-not-sent').scrollIntoViewIfNeeded();
      await demo.pause(2800);
      await shot(demo, 'desktop-not-sent');
      state.application = null;
      state.province = 'NU';
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/review`, { ready: false });
      await heading(demo, 'No provider yet for your province');
      await demo.pause(2600);
      await shot(demo, 'desktop-no-provider');
      state.taxFiled = 'No';
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/estimate`, { ready: false });
      await app(demo).getByTestId('estimate-tax-return').waitFor();
      await demo.pause(2600);
      await shot(demo, 'desktop-no-tax-return');
    },
  },
];
