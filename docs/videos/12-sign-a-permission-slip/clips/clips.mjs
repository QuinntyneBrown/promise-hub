// Screen recordings for video 12, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: two guardian links for the field trip's slip.
const families = {
  'tok-mateo': { language: 'es', guardianName: 'Carmen', signer: 'Carmen Rivera', child: { name: 'Mateo Rivera', firstName: 'Mateo', age: 9, allergies: 'Peanuts (anaphylaxis); tree nuts (hives)', medication: 'EpiPen 0.3 mg, carried' }, contact: { name: 'Carmen Rivera', phone: '905-555-0142' } },
  'tok-jordan': { language: 'en', guardianName: 'Dana', signer: 'Dana Thompson', child: { name: 'Jordan Thompson', firstName: 'Jordan', age: 11, allergies: null, medication: null }, contact: { name: 'Dana Thompson', phone: '905-555-0117' } },
};

async function fakeApi(demo, { trusted = false } = {}) {
  let verified = trusted;
  const answers = {};
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const token = path.split('/')[4];
    const family = families[token];
    if (path === '/api/g/auth/code') return route.fulfill({ status: 202 });
    if (path === '/api/g/auth/verify') {
      verified = true;
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/sign') || path.endsWith('/decline')) {
      answers[token] = path.endsWith('/sign') ? 'Signed' : 'Declined';
      return route.fulfill({ status: 204 });
    }
    if (family && !verified) {
      return route.fulfill({ status: 401, json: { code: 'verification-required', language: family.language, organization: 'Harbourview Youth Collective', phone: '905-555-0100', contacts: ['•••-•••-0142'] } });
    }
    if (family) {
      return route.fulfill({
        json: {
          language: family.language, organization: 'Harbourview Youth Collective', phone: '905-555-0100', guardianName: family.guardianName,
          event: { name: 'Fall field trip: Royal Botanical Gardens', startsAt: '2026-11-14T14:00:00Z', endsAt: '2026-11-14T20:00:00Z', place: 'Royal Botanical Gardens' },
          child: family.child, emergencyContact: family.contact, title: 'Fall field trip: Royal Botanical Gardens',
          body: 'We’re taking the After-School Tutoring group to the Royal Botanical Gardens on Saturday 14 November. The bus leaves at 8:45 am.',
          signBy: '2026-11-12', askPhotos: true, askSwimming: false, askLunch: true,
          status: answers[token] ?? 'Open', answeredAt: answers[token] ? new Date().toISOString() : null, answeredBy: answers[token] ? family.signer : null,
        },
      });
    }
    return route.fulfill({ status: 599 });
  });
}

export default [
  {
    name: 'carmen-signs-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo);
      await demo.go('/g/slip/tok-mateo', { ready: false });
      await demo.app().getByRole('heading', { level: 1 }).waitFor();
      demo.mark();
      await demo.pause(1800);
      await demo.type(demo.app().getByLabel('Su número de celular o correo'), '905-555-0142');
      await demo.click(demo.app().getByRole('button', { name: 'Envíenme un código' }));
      await demo.pause(1200);
      await demo.type(demo.app().getByLabel('Código de seis dígitos'), '482913');
      await demo.click(demo.app().getByRole('button', { name: 'Continuar' }));
      await demo.app().getByRole('heading', { name: 'Autorización para Mateo' }).waitFor();
      await demo.pause(2500);
      const name = demo.app().getByLabel('Escriba su nombre completo para firmar');
      await name.scrollIntoViewIfNeeded();
      await demo.pause(1000);
      await demo.type(name, 'Carmen Rivera');
      await demo.click(demo.app().getByRole('button', { name: 'Firmar la autorización' }));
      await demo.app().getByRole('heading', { name: 'Firmado. Gracias, Carmen' }).waitFor();
      await demo.pause(3000);
    },
  },
  {
    name: 'dana-declines-phone',
    phone: true,
    run: async (demo) => {
      await fakeApi(demo, { trusted: true });
      await demo.go('/g/slip/tok-jordan', { ready: false });
      await demo.app().getByRole('heading', { name: 'Permission slip for Jordan' }).waitFor();
      demo.mark();
      await demo.pause(1500);
      const decline = demo.app().getByRole('button', { name: 'Jordan can’t come' });
      await decline.scrollIntoViewIfNeeded();
      await demo.pause(800);
      await demo.click(decline);
      await demo.type(demo.app().getByLabel('Why not? (optional)'), 'Family trip that weekend');
      await demo.click(demo.app().getByRole('dialog').getByRole('button', { name: 'Decline' }));
      await demo.app().getByRole('heading', { name: 'Jordan won’t go' }).waitFor();
      await demo.pause(3000);
    },
  },
];
