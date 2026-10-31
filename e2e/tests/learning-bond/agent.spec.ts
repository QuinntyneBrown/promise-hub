import { test, expect } from '../../fixtures/test';
import { GuardianLearningBondPage } from '../../pages/guardian-learning-bond.page';
import { LearningBondAgentDialogPage } from '../../pages/learning-bond-agent-dialog.page';

// L2-160 the agent's bubble shows the approved fixed line first and the model's words when they come; questions go in the Ask dialog, a
// SIN typed there is refused and never reaches the model, and the conversation is the household's own. L2-163: accessible on a phone.
test.describe('A guardian talks to the Learning Bond agent', () => {
  test.use({ signedInAs: null });
  test.beforeEach(({ api }) => {
    api.setHouseholdLanguage('hh-rivera', 'English');
    api.learningBond.links.set('tok-lb-rivera', { householdId: 'hh-rivera', organizationId: 'org-harbourview', language: 'en' });
    api.trustGuardianDevice('hh-rivera');
    api.learningBond.consents.push({ householdId: 'hh-rivera', childId: 'c-mateo', typedName: 'Carmen Rivera', language: 'en', wordingVersion: 1 });
    api.learningBond.claims.set('c-mateo', { childLast3: '459', recordFix: null });
    api.learningBond.intakes.set('hh-rivera', { guardianLast3: '212', taxFiled: 'Yes' });
  });

  // L2-160 criterion 6 (learning-bond-estimate/default, the model's words).
  test('Given the model answers in time, then its words replace the fixed line', async ({ page, api }) => {
    api.learningBond.agentLines.set('Estimate', 'Mateo may get up to $1,400. It builds from $500 the first year and $100 each year after.');
    const learningBond = new GuardianLearningBondPage(page);

    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.agent).toHaveText('Learning Bond: Mateo may get up to $1,400. It builds from $500 the first year and $100 each year after.');
  });

  // L2-160 criterion 4: slow or down, the approved line stands and the page works.
  test('Given the model is down, then the approved fixed line stays', async ({ page }) => {
    const learningBond = new GuardianLearningBondPage(page);

    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await expect(learningBond.agent).toHaveText(
      'Learning Bond: I worked this out from Mateo’s birth year with the Government of Canada’s rules. It isn’t a promise: the Government confirms it from your tax returns.',
    );
    await expect(page.getByRole('link', { name: 'Review Mateo’s application' })).toBeVisible();
  });

  // L2-160 criteria 6 and 7 (learning-bond-ask/default, /answered): one question, answered, kept for the household.
  test('Given Carmen asks a question, then the answer and her question show in the conversation', async ({ page, api }) => {
    api.learningBond.agentAnswer = 'No. Claiming it is free, and the money stays in Mateo’s RESP.';
    const learningBond = new GuardianLearningBondPage(page);
    const ask = new LearningBondAgentDialogPage(page);
    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await ask.openFrom('Ask a question');
    await expect(ask.opening).toHaveText('Learning Bond: Ask anything about this step. I explain; you decide.');
    await ask.expectAccessible();
    await ask.ask('Your question', 'Does it cost anything?', 'Send');

    await expect(ask.messages('Ask Learning Bond')).toHaveText(['Does it cost anything?', 'No. Claiming it is free, and the money stays in Mateo’s RESP.']);
    await expect(ask.authors('Ask Learning Bond')).toHaveText(['You', 'Learning Bond']);
    await ask.expectAccessible();
  });

  // L2-160 criterion 1, L2-159 (learning-bond-ask/sin-refused): a SIN in the chat is refused and never sent.
  test('Given Carmen types a SIN, then it is refused and never reaches the model', async ({ page, api }) => {
    const learningBond = new GuardianLearningBondPage(page);
    const ask = new LearningBondAgentDialogPage(page);
    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await ask.openFrom('Ask a question');
    await ask.ask('Your question', 'My SIN is 123 456 789', 'Send');

    await expect(ask.messages('Ask Learning Bond')).toHaveText(['My SIN is [number removed]', 'Please don’t type your SIN here. It goes only in the form field.']);
    expect(api.learningBond.agentSent).toEqual([]);
  });

  // L2-163 (learning-bond-ask/answered, phone and laptop): no sideways scroll.
  test('Given an answer, then the Ask dialog fits the screen', async ({ page, api }) => {
    api.learningBond.agentAnswer = 'Tap Review Mateo’s application when you’re ready. Nothing is sent until you tap Submit.';
    const learningBond = new GuardianLearningBondPage(page);
    const ask = new LearningBondAgentDialogPage(page);
    await learningBond.openEstimate('tok-lb-rivera', 'c-mateo');

    await ask.openFrom('Ask a question');
    await ask.ask('Your question', 'What do I do next?', 'Send');

    await expect(ask.messages('Ask Learning Bond')).toHaveCount(2);
    await ask.expectNoHorizontalScroll();
    await ask.expectAccessible();
  });
});
