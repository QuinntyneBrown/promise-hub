import { test, expect } from '../../fixtures/test';
import { GuardianSlipPage } from '../../pages/guardian-slip.page';
import { GuardianSurveyPage } from '../../pages/guardian-survey.page';

// L2-043 surveys, L2-026 verification, L2-027 household language, L2-005 Reports off, L2-035/L2-036.
test.describe('Complete a survey as a guardian', () => {
  test.use({ signedInAs: null });

  test('Given a survey link on a new device, when Carmen verifies, then the survey shows in Spanish and she answers once', async ({ page, api }) => {
    const verify = new GuardianSlipPage(page);
    const survey = new GuardianSurveyPage(page);
    await survey.open('tok-survey-mateo');

    await verify.identify('905-555-0142', 'Su número de celular o correo');
    await verify.enterCode(api.guardianCode, 'Código de seis dígitos');

    await expect(survey.heading).toHaveText('Dos preguntas rápidas, Carmen');
    expect(await survey.language).toBe('es');
    await survey.rate(4);
    await survey.comment('Le encantó.');
    await survey.send('Enviar');
    await expect(survey.heading).toHaveText('Gracias');
    await survey.expectAccessible();
    await survey.expectNoHorizontalScroll();
  });

  test('Given no rating, when sent, then it asks for a number', async ({ page, api }) => {
    api.trustGuardianDevice('hh-rivera');
    const survey = new GuardianSurveyPage(page);
    await survey.open('tok-survey-mateo');

    await survey.send('Enviar');

    await expect(page.getByText('Pick a number from 1 to 5.')).toBeVisible();
    await survey.expectAccessible();
  });

  test('Given a closed survey, when opened, then it says it has closed', async ({ page, api }) => {
    api.trustGuardianDevice('hh-rivera');
    api.closeSurvey('tok-survey-mateo');
    const survey = new GuardianSurveyPage(page);

    await survey.open('tok-survey-mateo');

    await expect(survey.heading).toHaveText('Esta encuesta está cerrada');
  });

  test('Given Reports is off, when the link is opened, then the page is not available', async ({ page, api }) => {
    api.trustGuardianDevice('hh-rivera');
    api.setModules('org-harbourview', ['Roster', 'RollCall']);
    const survey = new GuardianSurveyPage(page);

    await survey.open('tok-survey-mateo');

    await expect(survey.heading).toHaveText('This page isn’t available');
  });
});
