import { test, expect } from '../../fixtures/test';
import { OrganizationsPage } from '../../pages/organizations.page';
import { SignInPage } from '../../pages/sign-in.page';

// L2-003 platform administration, L2-001 tenants, L2-035/L2-036.
test.describe('Manage organizations as a platform admin', () => {
  test.use({ signedInAs: 'm-tom' });

  test('Given every tenant, when the list opens, then each shows plan, children, modules and status', async ({ page }) => {
    const orgs = new OrganizationsPage(page);

    await orgs.open();

    await expect(orgs.rows()).toHaveCount(2);
    await expect(orgs.row('Harbourview Youth Collective')).toContainText('Standard');
    await expect(orgs.row('Harbourview Youth Collective')).toContainText('10 of 11');
    await expect(orgs.row('Harbourview Youth Collective')).toContainText('Active');
    await expect(orgs.row('Northgate Community Church Kids')).toContainText('Setting up');
    await orgs.expectAccessible();
    await orgs.expectNoHorizontalScroll();
  });

  test('Given a search or a filter, when applied, then only matching organizations remain', async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.open();

    await orgs.filter(/Setting up/);
    await expect(orgs.rows()).toHaveCount(1);
    await orgs.filter(/All/);
    await orgs.search('Kitchener');

    await expect(orgs.emptyHeading('No organization matches “Kitchener”')).toBeVisible();
  });

  test('Given a name, admin email, plan and preset, when created, then the tenant is listed as setting up and the admin is emailed', async ({ page, api }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.open();

    await orgs.add({ name: 'Kitchener Youth Alliance', email: 'dana@kitcheneryouth.example', plan: 'Free (up to 50 children)', modules: 'Just check-in' });

    await expect(orgs.dialog.getByRole('heading', { name: 'Kitchener Youth Alliance is ready' })).toBeVisible();
    await orgs.dialog.getByRole('button', { name: 'Done' }).click();
    await expect(orgs.row('Kitchener Youth Alliance')).toContainText('3 of 11');
    await expect(orgs.row('Kitchener Youth Alliance')).toContainText('Setting up');
    expect(api.welcomeEmails).toEqual(['dana@kitcheneryouth.example']);
  });

  test('Given no name and a bad email, when created, then each field says what is wrong', async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.open();

    await orgs.add({ name: '', email: 'dana@kya' });

    await expect(orgs.fieldError('Enter the organization’s name.')).toBeVisible();
    await expect(orgs.fieldError('That doesn’t look like an email address.')).toBeVisible();
    await orgs.expectAccessible();
  });

  test('Given a reason, when suspended, then the row says so and reinstating restores it', async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.open();

    await orgs.suspend('Northgate Community Church Kids', 'Unpaid invoice');

    await expect(orgs.row('Northgate Community Church Kids')).toContainText('Suspended');
    await orgs.reinstate('Northgate Community Church Kids');
    await expect(orgs.row('Northgate Community Church Kids')).toContainText('Setting up');
  });
});

test.describe('Suspended organization', () => {
  test.use({ signedInAs: 'm-grace' });

  test('Given Northgate is suspended, when Grace opens PromiseHub, then sign in says her organization is suspended', async ({ page, api }) => {
    api.suspend('org-northgate');

    await page.goto('/');

    await expect(new SignInPage(page).heading).toHaveText('Your organization is suspended');
  });

  test('Given an organization admin, when the platform list opens, then it is for platform admins only', async ({ page }) => {
    const orgs = new OrganizationsPage(page);

    await orgs.open();

    await expect(orgs.forbidden).toBeVisible();
  });
});
