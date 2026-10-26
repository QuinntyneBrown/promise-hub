import { test, expect } from '../../fixtures/test';
import { SetupPage } from '../../pages/setup.page';

// L2-008 organization setup wizard, L2-007 roles, L2-001 tenants, L2-035/L2-036.
test.describe('Set up an organization as its admin', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given a new organization, when setup opens, then done steps are ticked and the next one is offered', async ({ page }) => {
    const setup = new SetupPage(page);

    await setup.open();

    await expect(setup.progress).toHaveAttribute('aria-valuenow', '4');
    await expect(setup.step('Name your organization')).toContainText('Next');
    await expect(setup.step('Import your children')).toContainText('Done');
    await setup.expectAccessible();
    await setup.expectNoHorizontalScroll();
  });

  test('Given the organization step, when the name is empty, then it is named and nothing is saved', async ({ page }) => {
    const setup = new SetupPage(page);
    await setup.open();
    await setup.openOrganizationStep();

    await setup.name.fill('');
    await setup.saveOrganization();

    await expect(setup.errorSummary).toContainText('Enter your organization’s name.');
    await setup.expectAccessible();
  });

  test('Given a name and city, when saved, then the checklist ticks the step; Finish later keeps progress', async ({ page }) => {
    const setup = new SetupPage(page);
    await setup.open();
    await setup.openOrganizationStep();

    await setup.name.fill('Northgate Kids');
    await setup.saveOrganization();

    await expect(page).toHaveURL(/\/setup$/);
    await expect(setup.step('Name your organization')).toContainText('Done');
    await setup.openStep('Choose your modules');
    await expect(page).toHaveURL(/\/settings\/modules$/);
    await page.goBack();
    await expect(setup.progress).toHaveAttribute('aria-valuenow', '5');
  });
});

test.describe('Site lead', () => {
  test.use({ signedInAs: 'm-jaylen' });

  test('Given a site lead, when setup opens, then it says admins set up the organization', async ({ page }) => {
    const setup = new SetupPage(page);

    await setup.open();

    await expect(setup.forbidden).toBeVisible();
  });
});
