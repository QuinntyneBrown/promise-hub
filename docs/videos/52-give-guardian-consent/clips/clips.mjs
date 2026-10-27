// Screen recordings and screenshots for video 52, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Sofía's Learning gate and her request, Carmen's consent
// link with the code check, signing and withdrawal, Sofía's record with the Guardian consent card, and the consent
// policy on Privacy and data (L2-055 to L2-058).
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const shots = join(dirname(fileURLToPath(import.meta.url)), '..', 'shots');
const suite = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const harbourview = { organizationId: 'org-harbourview', organizationName: 'Harbourview Youth Collective', plan: 'Standard', modules: [...suite, 'Learning', 'Mentoring'] };
const people = {
  tom: { personName: 'Tom Nguyen', role: 'Admin', ...harbourview },
  marisol: { personName: 'Marisol Delgado', role: 'ProgramDirector', ...harbourview },
  sofia: { personName: 'Sofía Rivera', role: 'Youth', ...harbourview },
};
const wording =
  'I consent to my child taking part in lessons, mentoring and program activities at Harbourview Youth Collective, and to staff contacting them about their program.';
const sofiaChild = {
  id: 'c-sofia', name: 'Sofía Rivera', firstName: 'Sofía', lastName: 'Rivera', dateOfBirth: '2014-06-02', age: 12,
  school: 'Bennetto Elementary, Grade 7', householdId: 'hh-rivera', householdName: 'Rivera',
  medical: { allergies: null, medication: 'Inhaler as needed', conditions: 'Asthma', doctor: null, redAlert: false, alertInstruction: null, healthCard: null, updatedAt: '2026-09-02T19:55:00Z', updatedBy: 'Carmen Rivera' },
  medicalRestricted: false,
};

/** The API as the real one answers it; `state` holds the session's person, the consent and the policy. */
async function fakeApi(demo, state) {
  state.policy ??= { consentAge: 18, wording };
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const consent = state.consent ?? null;
    const status = !consent ? 'Needed' : consent.withdrawnAt ? 'Withdrawn' : 'Given';
    const g = path.match(/^\/api\/g\/consent\/([^/]+)(\/sign|\/withdraw)?$/);
    if (path === '/api/g/auth/code') return route.fulfill({ status: 202 });
    if (path === '/api/g/auth/verify') {
      state.trusted = true;
      return route.fulfill({ status: 204 });
    }
    if (g) {
      if (!state.trusted) return route.fulfill({ status: 401, json: { code: 'verification-required', language: 'es', organization: 'Harbourview Youth Collective', phone: '905-555-0100', contacts: ['•••-•••-0142'] } });
      const [, , action] = g;
      if (action === '/sign') {
        const b = route.request().postDataJSON();
        const errors = {};
        if (!b.relationship) errors.relationship = 'Choose how you’re related to Sofía.';
        if (!b.agree) errors.agree = 'Tick the box to give consent.';
        if (b.name.trim().toLowerCase() !== 'carmen rivera') errors.name = b.name.trim() ? 'That name doesn’t match a guardian of Sofía.' : 'Type your full name to sign.';
        if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
        state.consent = { signedBy: 'Carmen Rivera', relationship: b.relationship, signedAt: '2026-11-05T21:41:00Z', reference: 'GC-4F7A2C', withdrawnAt: null, withdrawnBy: null };
        return route.fulfill({ status: 204 });
      }
      if (action === '/withdraw') {
        state.consent = { ...consent, withdrawnAt: '2026-11-05T21:52:00Z', withdrawnBy: 'Carmen Rivera' };
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({
        json: {
          language: 'es', organization: 'Harbourview Youth Collective', phone: '905-555-0100', guardianName: 'Carmen',
          child: { name: 'Sofía Rivera', firstName: 'Sofía', age: 12 }, wording: state.policy.wording, consentAge: state.policy.consentAge, status,
          signedBy: consent?.signedBy ?? null, relationship: consent?.relationship ?? null, signedAt: consent?.signedAt ?? null, reference: consent?.reference ?? null,
          withdrawnAt: consent?.withdrawnAt ?? null, withdrawnBy: consent?.withdrawnBy ?? null,
        },
      });
    }
    const me = state.signedIn && people[state.signedIn];
    if (!me) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } });
    if (path === '/api/me') return route.fulfill({ json: me });
    if (path === '/api/notifications') return route.fulfill({ json: { unread: 0, items: [] } });
    if (path === '/api/me/organizations') return route.fulfill({ json: { organizations: [] } });
    if (path === '/api/learning/lessons') {
      return route.fulfill(status === 'Given' ? { json: { lessons: [] } } : { status: 403, json: { code: 'consent-required', consentAge: 18 } });
    }
    if (path === '/api/learning/consent-request' || (path === '/api/children/c-sofia/consent-request' && method === 'POST')) {
      state.sentAt = '2026-11-05T21:30:00Z';
      return route.fulfill({ status: 202, json: { sentTo: ['•••-•••-0142'] } });
    }
    if (path === '/api/children/c-sofia') return route.fulfill({ json: sofiaChild });
    if (path === '/api/children/c-sofia/youth-account') return route.fulfill({ json: { status: 'Active', name: 'Sofía Rivera', email: 'sofia@harbourview.example', expiresAt: null } });
    if (path === '/api/children/c-sofia/consent') {
      return route.fulfill({
        json: {
          required: true, consentAge: 18, status, signedBy: consent?.signedBy ?? null, relationship: consent?.relationship ?? null, signedAt: consent?.signedAt ?? null,
          reference: consent?.reference ?? null, withdrawnAt: consent?.withdrawnAt ?? null, withdrawnBy: consent?.withdrawnBy ?? null, linkSentAt: state.sentAt ?? null,
        },
      });
    }
    if (path === '/api/settings/privacy') return route.fulfill({ json: { region: 'Canada (Toronto region)', consentRetentionYears: 7 } });
    if (path === '/api/settings/data-requests') return route.fulfill({ json: { requests: [] } });
    if (path === '/api/settings/consent') {
      if (method === 'PUT') {
        state.policy = route.request().postDataJSON();
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: state.policy });
    }
    return route.fulfill({ status: 404 });
  });
}

const heading = (demo, name) => demo.app().getByRole('heading', { level: 1, name }).waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });

export default [
  {
    // Sofía (12) opens Learning: the server refuses her lessons, and she asks her guardian.
    name: 'youth-gate-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { signedIn: 'sofia' });
      await demo.go('/learning', { ready: false });
      await demo.app().getByRole('heading', { name: 'A guardian needs to give consent' }).waitFor();
      demo.mark();
      await shot(demo, 'phone-consent-required');
      await demo.pause(2000);
      await demo.click(demo.app().getByRole('button', { name: 'Ask my guardian' }));
      await demo.app().getByRole('heading', { name: 'We asked your guardian' }).waitFor();
      await demo.pause(1200);
      await shot(demo, 'phone-asked');
      await demo.pause(2000);
    },
  },
  {
    // Carmen opens the texted link, verifies her phone, reads the consent in Spanish, fixes two mistakes and signs.
    name: 'guardian-consent-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, {});
      await demo.go('/g/consent/tok-consent-sofia', { ready: false });
      await heading(demo, 'Confirme que es usted');
      demo.mark();
      await shot(demo, 'phone-verify');
      await demo.pause(1200);
      await demo.type(demo.app().getByRole('textbox', { name: 'Su número de celular o correo' }), '905-555-0142');
      await demo.click(demo.app().getByRole('button', { name: 'Envíenme un código' }));
      await demo.type(demo.app().getByRole('textbox', { name: 'Código de seis dígitos' }), '482913');
      await demo.click(demo.app().getByRole('button', { name: 'Continuar' }));
      await heading(demo, 'Consentimiento para Sofía');
      await demo.pause(1200);
      await shot(demo, 'phone-consent-es');
      await demo.type(demo.app().getByRole('textbox', { name: 'Escriba su nombre completo para firmar' }), 'Carmen R');
      await demo.click(demo.app().getByRole('button', { name: 'Dar consentimiento' }));
      await demo.app().getByText('Tick the box to give consent.').waitFor();
      await demo.app().getByText('Tick the box to give consent.').scrollIntoViewIfNeeded();
      await demo.pause(1400);
      await shot(demo, 'phone-consent-invalid');
      await demo.app().getByRole('combobox', { name: 'Su relación con Sofía' }).selectOption({ label: 'Madre o padre' });
      await demo.click(demo.app().getByRole('checkbox'));
      await demo.app().getByRole('textbox', { name: 'Escriba su nombre completo para firmar' }).fill('');
      await demo.type(demo.app().getByRole('textbox', { name: 'Escriba su nombre completo para firmar' }), 'Carmen Rivera');
      await demo.click(demo.app().getByRole('button', { name: 'Dar consentimiento' }));
      await heading(demo, 'Consentimiento dado. Gracias, Carmen');
      await demo.pause(1200);
      await shot(demo, 'phone-consent-signed');
      await demo.pause(2000);
    },
  },
  {
    // Once Carmen has consented, Sofía checks again and Learning opens.
    name: 'learning-open-phone',
    phone: true,
    run: async (demo) => {
      const state = { signedIn: 'sofia' };
      await fakeApi(demo, state);
      await demo.go('/learning', { ready: false });
      await demo.app().getByRole('heading', { name: 'A guardian needs to give consent' }).waitFor();
      demo.mark();
      await demo.click(demo.app().getByRole('button', { name: 'Ask my guardian' }));
      await demo.app().getByRole('heading', { name: 'We asked your guardian' }).waitFor();
      await demo.pause(1500);
      state.consent = { signedBy: 'Carmen Rivera', relationship: 'Parent', signedAt: '2026-11-05T21:41:00Z', reference: 'GC-4F7A2C', withdrawnAt: null, withdrawnBy: null };
      await demo.click(demo.app().getByRole('button', { name: 'Check again' }));
      await demo.app().getByRole('heading', { name: 'No lessons yet' }).waitFor();
      await demo.pause(1200);
      await shot(demo, 'phone-learning-open');
      await demo.pause(1800);
    },
  },
  {
    // Carmen opens the link again: the record, then Withdraw consent in a dialog.
    name: 'withdraw-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { trusted: true, consent: { signedBy: 'Carmen Rivera', relationship: 'Parent', signedAt: '2026-11-05T21:41:00Z', reference: 'GC-4F7A2C', withdrawnAt: null, withdrawnBy: null } });
      await demo.go('/g/consent/tok-consent-sofia', { ready: false });
      await heading(demo, 'Consentimiento ya dado');
      demo.mark();
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Retirar el consentimiento' }));
      await demo.pause(1200);
      await shot(demo, 'phone-withdraw-dialog');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Retirar el consentimiento' }));
      await heading(demo, 'Consentimiento retirado');
      await demo.pause(1200);
      await shot(demo, 'phone-withdrawn');
      await demo.pause(2000);
    },
  },
  {
    // Tom on Sofía's record: consent needed, then he sends the link.
    name: 'child-consent-desktop',
    run: async (demo) => {
      await fakeApi(demo, { signedIn: 'tom' });
      await demo.go('/families/hh-rivera/children/c-sofia', { ready: false });
      await demo.app().getByText('Needed before Sofía can use Learning').waitFor();
      demo.mark();
      await shot(demo, 'desktop-child-needed');
      await demo.pause(1800);
      await demo.click(demo.app().getByRole('button', { name: 'Send consent link' }));
      await demo.app().getByText('Consent link sent').waitFor();
      await demo.pause(1200);
      await shot(demo, 'desktop-child-sent');
      await demo.pause(2200);
    },
  },
  {
    // Marisol sets the consent age and wording on Privacy and data.
    name: 'policy-desktop',
    run: async (demo) => {
      await fakeApi(demo, { signedIn: 'marisol' });
      await demo.go('/settings/privacy', { ready: false });
      await demo.app().getByRole('button', { name: 'Edit consent policy' }).waitFor();
      await demo.app().getByRole('button', { name: 'Edit consent policy' }).scrollIntoViewIfNeeded();
      demo.mark();
      await demo.pause(1500);
      await shot(demo, 'desktop-privacy-consent');
      await demo.click(demo.app().getByRole('button', { name: 'Edit consent policy' }));
      await demo.pause(800);
      await demo.app().getByRole('combobox', { name: 'Consent needed under' }).selectOption({ label: '16 years' });
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Save policy' }));
      await demo.app().getByText('Consent policy saved').waitFor();
      await demo.pause(2400);
    },
  },
];
