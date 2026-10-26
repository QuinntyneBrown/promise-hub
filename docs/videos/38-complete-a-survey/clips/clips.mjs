// Screen recordings for video 38, made with tools/video-record/record-clips.mjs against the
// running frontend. The backend is faked like the e2e suite: Carmen answers the survey in Spanish on her phone.
function surveyApi() {
  let answered = false;
  return async (demo) => {
    await demo.page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/g/survey/tok-survey-mateo' && route.request().method() === 'GET') {
        return route.fulfill({
          json: {
            language: 'es', organization: 'Harbourview Youth Collective', organizationPhone: '905-555-0100', guardianFirstName: 'Carmen',
            eventName: 'Tutoring night', childFirstName: 'Mateo', sentBy: 'Marisol Delgado', status: answered ? 'Answered' : 'Open',
          },
        });
      }
      if (path === '/api/g/survey/tok-survey-mateo') {
        answered = true;
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ status: 599 });
    });
  };
}

export default [
  {
    name: 'survey-phone',
    phone: true,
    run: async (demo) => {
      await surveyApi()(demo);
      await demo.go('/g/survey/tok-survey-mateo', { ready: false });
      await demo.app().getByRole('heading', { name: 'Dos preguntas rápidas, Carmen' }).waitFor();
      demo.mark();
      await demo.pause(3000);
      await demo.click(demo.app().getByRole('radio', { name: '4', exact: true }));
      await demo.pause(800);
      await demo.app().getByRole('textbox').pressSequentially('Le encantó la tutoría.', { delay: 60 });
      await demo.pause(800);
      await demo.click(demo.app().getByRole('button', { name: 'Enviar' }));
      await demo.app().getByRole('heading', { name: 'Gracias' }).waitFor();
      await demo.pause(3000);
    },
  },
];
