// Screen recordings and screenshots for video 92, made with tools/video-record/record-clips.mjs against the running frontend. The backend
// is faked like the e2e suite: Carmen Rivera's estimate shows the agent's approved line, then the model's words replace it; she asks a
// question in the Ask dialog; on a laptop the model is down and the approved line stays, a SIN typed into the chat is refused and never
// sent on, and a send that fails says so; her family page in Spanish gets its words in Spanish (L2-160, L2-163). No SIN is real.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, '..', 'shots');

const ORG = 'Harbourview Youth Collective';
const TOKEN = 'tok-lb-rivera';
const BASE = `/api/g/learning-bond/${TOKEN}`;
const FIXED = 'I worked this out from Mateo’s birth year with the Government of Canada’s rules. It isn’t a promise: the Government confirms it from your tax returns.';
const MODEL = 'Mateo may get up to $1,400: $500 for his first year and $100 for each year since. The Government confirms it from your tax returns.';
const ANSWER = 'No. Claiming it is free, and you never have to put money in. The $1,400 goes into Mateo’s RESP at Northfield Learning Plans.';
const NINE = /(?<!\d)\d{3}[\s-]?\d{3}[\s-]?\d{3}(?!\d)/g;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** The guardian endpoints the clips use, as the real API answers them (LearningBondAgent and the estimate and page handlers). */
async function fakeApi(demo, state) {
  await demo.page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === BASE) return route.fulfill({ json: { organization: ORG, language: state.language } });
    const rest = path.slice(BASE.length);
    if (rest === '/children/c-mateo/estimate')
      return route.fulfill({
        json: { language: 'en', organization: ORG, explanation: FIXED, childId: 'c-mateo', firstName: 'Mateo', amount: 1400, ruleVersion: 1, bornBefore2004: false, needsTaxReturn: false },
      });
    if (rest === '/page')
      return route.fulfill({
        json: {
          language: 'es',
          organization: ORG,
          phone: '905-555-0100',
          explanation: `El Bono de Estudios Canadiense es dinero que el Gobierno de Canadá pone en el RESP de un niño para familias con ingresos más bajos. No necesita poner dinero. Lo que escriba va al proveedor del RESP y al Gobierno de Canadá, no a ${ORG}.`,
          children: [
            { id: 'c-mateo', firstName: 'Mateo', age: 9, programs: ['After‑School Tutoring'], amount: 1400, selfClaim: false, claim: null },
            { id: 'c-sofia', firstName: 'Sofía', age: 12, programs: ['After‑School Tutoring'], amount: 1700, selfClaim: false, claim: null },
          ],
          status: 'Invited',
          consents: [],
          benefits: { offered: false, consented: false },
        },
      });
    if (rest === '/total') return route.fulfill({ status: 404 });
    if (rest === '/agent/conversation') return route.fulfill({ json: { messages: state.conversation } });
    if (rest === '/agent') {
      const body = route.request().postDataJSON();
      const message = (body.message ?? '').trim();
      await wait(state.delay);
      if (!message) return route.fulfill({ json: { step: body.step, fixed: '', reply: state.line, source: state.line ? 'model' : 'fixed' } });
      if (state.fail) return route.fulfill({ status: 502 });
      const at = new Date().toISOString();
      if (message.match(NINE)) {
        const refusal = 'Please don’t type your SIN here. It goes only in the form field.';
        state.conversation.push({ role: 'Guardian', text: message.replace(NINE, '[number removed]'), step: body.step, at }, { role: 'Agent', text: refusal, step: body.step, at });
        return route.fulfill({ json: { step: body.step, fixed: '', reply: refusal, source: 'fixed' } });
      }
      state.conversation.push({ role: 'Guardian', text: message, step: body.step, at }, { role: 'Agent', text: state.answer, step: body.step, at });
      return route.fulfill({ json: { step: body.step, fixed: '', reply: state.answer, source: 'model' } });
    }
    return route.fulfill({ status: 404 });
  });
}

const app = (demo) => demo.app();
const heading = (demo, name) => app(demo).getByRole('heading', { level: 1, name }).first().waitFor();
const shot = (demo, name) => demo.page.locator('iframe').screenshot({ path: join(shots, `${name}.png`) });
const bubble = (demo) => app(demo).getByTestId('agent-text').first();

export default [
  {
    // The approved line first, the model's words after; then Carmen asks a question.
    name: 'estimate-phone',
    phone: true,
    run: async (demo) => {
      const state = { language: 'en', line: MODEL, answer: ANSWER, conversation: [], delay: 2200, fail: false };
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/estimate`, { ready: false });
      await heading(demo, 'Mateo may be owed up to $1,400.');
      demo.mark();
      await shot(demo, 'phone-fixed-line');
      await bubble(demo).getByText('$500 for his first year').waitFor();
      await demo.pause(3600);
      await shot(demo, 'phone-model-line');
      await demo.click(app(demo).getByRole('button', { name: 'Ask a question' }));
      await app(demo).getByRole('dialog').waitFor();
      await demo.pause(2200);
      await shot(demo, 'phone-ask-empty');
      state.delay = 1800;
      await demo.type(app(demo).getByRole('textbox', { name: 'Your question' }), 'Does it cost anything?');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Send' }));
      await demo.pause(500);
      await shot(demo, 'phone-ask-busy');
      await app(demo).getByRole('dialog').getByText('Claiming it is free').waitFor();
      await demo.pause(4200);
      await shot(demo, 'phone-ask-answered');
    },
  },
  {
    // On a laptop: the model is down and the approved line stays; a SIN is refused; a send that fails says so.
    name: 'safeguards-desktop',
    run: async (demo) => {
      const state = { language: 'en', line: null, answer: ANSWER, conversation: [], delay: 400, fail: false };
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}/children/c-mateo/estimate`, { ready: false });
      await heading(demo, 'Mateo may be owed up to $1,400.');
      demo.mark();
      await demo.pause(3400);
      await shot(demo, 'desktop-model-down');
      await demo.click(app(demo).getByRole('button', { name: 'Ask a question' }));
      await app(demo).getByRole('dialog').waitFor();
      await demo.type(app(demo).getByRole('textbox', { name: 'Your question' }), 'My SIN is 123 456 789');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Send' }));
      await app(demo).getByRole('dialog').getByText('[number removed]').waitFor();
      await demo.pause(3800);
      await shot(demo, 'desktop-sin-refused');
      state.fail = true;
      await demo.type(app(demo).getByRole('textbox', { name: 'Your question' }), 'Can you send it for me?');
      await demo.click(app(demo).getByRole('dialog').getByRole('button', { name: 'Send' }));
      await app(demo).getByRole('dialog').getByText('That didn’t go through. Try again.').waitFor();
      await demo.pause(3200);
      await shot(demo, 'desktop-ask-failed');
    },
  },
  {
    // Carmen's family page in Spanish: the model answers in the household's language.
    name: 'spanish-phone',
    phone: true,
    run: async (demo) => {
      const state = {
        language: 'es',
        line: 'Hola, Carmen. Mateo podría recibir hasta $1,400 y Sofía hasta $1,700. Es gratis y no tiene que poner dinero. Toque Continuar cuando quiera.',
        answer: ANSWER,
        conversation: [],
        delay: 1600,
        fail: false,
      };
      await fakeApi(demo, state);
      await demo.go(`/g/learning-bond/${TOKEN}`, { ready: false });
      await bubble(demo).waitFor();
      demo.mark();
      await bubble(demo).getByText('Hola, Carmen').waitFor();
      await demo.pause(4200);
      await shot(demo, 'phone-spanish');
    },
  },
];
