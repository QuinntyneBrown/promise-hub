// Screen recordings and screenshots for video 58, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Harbourview's After-School Tutoring link takes
// Malik Johnson's own application and Rachel Ellis's referral of Zoe Campbell (L2-071).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');
const SLUG = 'after-school-tutoring';
const CODE = '481203';
const TODAY = new Date('2026-11-05T21:12:00Z');

const newState = () => ({ roster: true, failPage: false, codes: new Map(), session: null, requests: [] });

function age(dateOfBirth) {
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  let a = TODAY.getUTCFullYear() - y;
  if (TODAY.getUTCMonth() + 1 < m || (TODAY.getUTCMonth() + 1 === m && TODAY.getUTCDate() < d)) a--;
  return a;
}

/** The server's draft rules for the three paths (L2-013, L2-071). */
function errorsOf(draft) {
  const e = {};
  const as = draft.applyingAs ?? 'Guardian';
  const h = draft.household ?? {};
  if (!h.mobile?.trim() && !h.email?.trim()) e.mobile = 'Add a mobile number or an email.';
  if (as === 'Guardian') {
    if (!h.guardianName?.trim()) e.guardianName = 'Enter your full name.';
    return e;
  }
  const youth = as === 'Youth';
  if (!h.guardianName?.trim()) e.guardianName = youth ? 'Enter your parent or guardian’s name.' : 'Enter their parent or guardian’s name.';
  const p = (draft.children ?? []).find((c) => c.enroll);
  if (!p?.firstName?.trim() || !p?.lastName?.trim()) e['children[0].name'] = 'Enter the young person’s first and last name.';
  if (!p?.dateOfBirth) e['children[0].dateOfBirth'] = 'Enter the young person’s date of birth.';
  else if (youth && (age(p.dateOfBirth) < 12 || age(p.dateOfBirth) > 18))
    e['children[0].dateOfBirth'] = 'Young people aged 12 to 18 can apply for themselves. Ask a parent or guardian to apply for you.';
  if (!draft.reason?.trim()) e.reason = youth ? 'Tell us why you’re interested.' : 'Tell us why you’re referring them.';
  if (!youth) {
    if (!draft.referrer?.name?.trim()) e.referrerName = 'Enter your full name.';
    if (!draft.referrer?.role?.trim()) e.referrerRole = 'Tell us how you know the young person.';
  }
  return e;
}

async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = () => request.postDataJSON() ?? {};
    const base = `/api/g/enroll/${SLUG}`;
    if (!path.startsWith(base) || !state.roster) return route.fulfill({ status: 404 });
    if (path === base) {
      if (state.failPage) {
        state.failPage = false;
        return route.fulfill({ status: 500, json: { code: 'server-error' } });
      }
      return route.fulfill({ json: { program: 'After‑School Tutoring', organization: 'Harbourview Youth Collective', phone: '905-555-0100', open: true, schedule: 'Mon–Thu, 4–6 pm', ages: '8 to 18', startsOn: '2026-09-08' } });
    }
    const contactOf = (typed) => (typed.includes('@') ? typed.trim().toLowerCase() : typed.replace(/\D/g, ''));
    const display = (c) => (c.includes('@') ? c : `${c.slice(0, 3)}-${c.slice(3, 6)}-${c.slice(6)}`);
    if (path === `${base}/code`) {
      const c = contactOf(body().contact ?? '');
      const n = state.codes.get(c) ?? 0;
      if (n >= 3) return route.fulfill({ status: 429, json: { code: 'too-many' } });
      state.codes.set(c, n + 1);
      return route.fulfill({ status: 202 });
    }
    if (path === `${base}/verify`) {
      const b = body();
      if (b.code !== CODE) return route.fulfill({ status: 422, json: { errors: { code: 'That code didn’t work. Check the latest text or email.' } } });
      state.session = { contact: contactOf(b.contact), draft: null, submitted: false };
      return route.fulfill({ status: 204 });
    }
    if (!state.session) return route.fulfill({ status: 401, json: { code: 'verification-required' } });
    const s = state.session;
    if (path === `${base}/draft` && request.method() === 'GET') {
      const c = s.contact;
      return route.fulfill({ json: { returning: false, language: 'en', program: 'After‑School Tutoring', contact: display(c), applyingAs: 'Guardian', household: { guardianName: null, mobile: c.includes('@') ? null : display(c), email: c.includes('@') ? c : null, language: 'English' }, children: [] } });
    }
    if (path === `${base}/draft`) {
      const draft = body();
      const errors = errorsOf(draft);
      if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
      s.draft = draft;
      return route.fulfill({ status: 204 });
    }
    if (path === `${base}/submit`) {
      const d = s.draft;
      const as = d.applyingAs ?? 'Guardian';
      const p = d.children.find((c) => c.enroll);
      const season = as === 'Guardian' || (as === 'Youth' && age(p.dateOfBirth) >= 18);
      if (!body().consent) {
        const consent = as === 'Referrer' ? 'Confirm the family agrees to be contacted.' : season ? 'Agree to the season consent to submit.' : 'Agree to the privacy notice to submit.';
        return route.fulfill({ status: 422, json: { errors: { consent } } });
      }
      const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
      const dup = state.requests.find((r) => same(r.firstName, p.firstName) && same(r.lastName, p.lastName) && r.dateOfBirth === p.dateOfBirth);
      if (dup) return route.fulfill({ status: 409, json: { code: 'duplicate', name: `${dup.firstName} ${dup.lastName}` } });
      state.requests.push({ firstName: p.firstName, lastName: p.lastName, dateOfBirth: p.dateOfBirth });
      s.submitted = true;
      return route.fulfill({ json: { status: 'WaitingReview', position: null, children: 1, program: 'After‑School Tutoring', appliedAs: as, seasonConsent: season } });
    }
    return route.fulfill({ status: 404 });
  });
}

const heading = (demo, name) => demo.app().getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const field = (demo, label) => demo.app().getByLabel(label, { exact: true });
const button = (demo, name) => demo.app().getByRole('button', { name, exact: true });

async function verify(demo, as, contact, fast = false) {
  await demo.click(demo.app().getByRole('radio', { name: as }));
  const put = (locator, text) => (fast ? locator.fill(text) : demo.type(locator, text));
  await put(demo.app().getByLabel('Your mobile number or email'), contact);
  await demo.click(button(demo, 'Send me a code'));
  await put(demo.app().getByLabel('Six-digit code'), CODE);
  await demo.click(button(demo, 'Continue'));
}

async function youngPerson(demo, v) {
  const put = (locator, text) => (v.fast ? locator.fill(text) : demo.type(locator, text));
  await put(field(demo, 'First name'), v.firstName);
  await put(field(demo, 'Last name'), v.lastName);
  await field(demo, 'Date of birth').fill(v.dateOfBirth);
  await demo.app().getByLabel(/^Why are you/).fill(v.reason);
}

async function guardian(demo, name, mobile) {
  await field(demo, 'Guardian’s full name').fill(name);
  await field(demo, 'Guardian’s mobile number').fill(mobile);
  await demo.pause(500);
}

export default [
  {
    // Malik, 14, applies for himself; his mother consents later.
    name: 'youth-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go(`/g/enroll/${SLUG}`, { ready: false });
      await heading(demo, 'Enroll in After‑School Tutoring');
      demo.mark();
      await demo.pause(1800);
      await shot(demo, 'desktop-who');
      await verify(demo, 'I’m the young person', '905-555-0311');
      await heading(demo, 'About you');
      await youngPerson(demo, { firstName: 'Malik', lastName: 'Johnson', dateOfBirth: '2012-04-18', reason: 'I want to learn to code and help with the younger kids.' });
      await demo.pause(800);
      await shot(demo, 'desktop-about-you');
      await demo.click(button(demo, 'Continue'));
      await heading(demo, 'Your parent or guardian');
      await guardian(demo, 'Denise Johnson', '905-555-0310');
      await demo.click(button(demo, 'Continue'));
      await heading(demo, 'Check and submit');
      await demo.click(demo.app().getByRole('switch', { name: /privacy notice/ }));
      await demo.pause(1200);
      await shot(demo, 'desktop-youth-review');
      await demo.click(button(demo, 'Submit'));
      await heading(demo, 'Thank you, Malik');
      await demo.pause(2600);
      await shot(demo, 'desktop-youth-submitted');
    },
  },
  {
    // Rachel Ellis, a guidance counsellor, refers Zoe Campbell.
    name: 'referrer-desktop',
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go(`/g/enroll/${SLUG}`, { ready: false });
      await heading(demo, 'Enroll in After‑School Tutoring');
      demo.mark();
      await demo.pause(1000);
      await verify(demo, 'I’m referring a young person', 'rachel.ellis@bennetto.example.ca');
      await heading(demo, 'About you');
      await demo.click(button(demo, 'Continue'));
      await demo.app().getByText('Enter your full name.').waitFor();
      await demo.pause(1200);
      await demo.type(field(demo, 'Your full name'), 'Rachel Ellis');
      await field(demo, 'Your role').fill('Guidance counsellor');
      await field(demo, 'School or organization (optional)').fill('Bennetto Elementary');
      await demo.pause(600);
      await shot(demo, 'desktop-referrer');
      await demo.click(button(demo, 'Continue'));
      await heading(demo, 'The young person');
      await youngPerson(demo, { firstName: 'Zoe', lastName: 'Campbell', dateOfBirth: '2013-01-20', reason: 'Zoe is curious and kind, and needs somewhere to belong after school.' });
      await demo.pause(600);
      await shot(demo, 'desktop-young-person');
      await demo.click(button(demo, 'Continue'));
      await heading(demo, 'Their parent or guardian');
      await guardian(demo, 'Tanya Campbell', '905-555-0320');
      await demo.click(button(demo, 'Continue'));
      await heading(demo, 'Check and submit');
      await demo.click(demo.app().getByRole('switch', { name: /agrees to be contacted/ }));
      await demo.pause(1200);
      await shot(demo, 'desktop-referral-review');
      await demo.click(button(demo, 'Submit'));
      await heading(demo, 'Thank you, Rachel');
      await demo.pause(2600);
      await shot(demo, 'desktop-referral-submitted');
    },
  },
  {
    // On a phone: who is applying, and a ten-year-old asked to have a guardian apply.
    name: 'phone',
    phone: true,
    run: async (demo) => {
      const state = newState();
      await fakeApi(demo, state);
      await demo.go(`/g/enroll/${SLUG}`, { ready: false });
      await heading(demo, 'Enroll in After‑School Tutoring');
      demo.mark();
      await demo.pause(1600);
      await shot(demo, 'phone-who');
      await verify(demo, 'I’m the young person', '905-555-0312');
      await heading(demo, 'About you');
      await youngPerson(demo, { firstName: 'Eli', lastName: 'Park', dateOfBirth: '2016-02-10', reason: 'My friends go.' });
      await demo.click(button(demo, 'Continue'));
      await demo.app().getByText('Young people aged 12 to 18 can apply for themselves. Ask').waitFor();
      await demo.app().locator('#youth-dob').scrollIntoViewIfNeeded();
      await demo.pause(2200);
      await shot(demo, 'phone-too-young');
    },
  },
  {
    // A duplicate application, too many codes, a failed load and Roster off.
    name: 'states-desktop',
    run: async (demo) => {
      const state = newState();
      state.requests.push({ firstName: 'Malik', lastName: 'Johnson', dateOfBirth: '2012-04-18' });
      await fakeApi(demo, state);
      await demo.go(`/g/enroll/${SLUG}`, { ready: false });
      await heading(demo, 'Enroll in After‑School Tutoring');
      demo.mark();
      await verify(demo, 'I’m the young person', '905-555-0311', true);
      await heading(demo, 'About you');
      await youngPerson(demo, { fast: true, firstName: 'malik', lastName: 'Johnson', dateOfBirth: '2012-04-18', reason: 'I want to learn to code.' });
      await demo.click(button(demo, 'Continue'));
      await heading(demo, 'Your parent or guardian');
      await guardian(demo, 'Denise Johnson', '905-555-0310');
      await demo.click(button(demo, 'Continue'));
      await heading(demo, 'Check and submit');
      await demo.click(demo.app().getByRole('switch', { name: /privacy notice/ }));
      await demo.click(button(demo, 'Submit'));
      await demo.app().getByText('Malik Johnson already has an application').waitFor();
      await demo.pause(2400);
      await shot(demo, 'desktop-duplicate');
      state.session = null;
      state.codes.set('9055550399', 3);
      await demo.go(`/g/enroll/${SLUG}`, { ready: false });
      await heading(demo, 'Enroll in After‑School Tutoring');
      await demo.app().getByLabel('Your mobile number or email').fill('905-555-0399');
      await demo.click(button(demo, 'Send me a code'));
      await demo.app().getByText('Too many codes').waitFor();
      await demo.pause(2000);
      await shot(demo, 'desktop-too-many');
      state.failPage = true;
      await demo.go(`/g/enroll/${SLUG}`, { ready: false });
      await demo.app().getByRole('heading', { level: 1 }).first().waitFor();
      await demo.pause(1600);
      await shot(demo, 'desktop-error');
      state.roster = false;
      await demo.go(`/g/enroll/${SLUG}`, { ready: false });
      await heading(demo, 'This page isn’t available');
      await demo.pause(1800);
      await shot(demo, 'desktop-unavailable');
    },
  },
];
