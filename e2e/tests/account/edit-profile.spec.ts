import { test, expect } from '../../fixtures/test';
import { AccountPage } from '../../pages/account.page';
import { ProfilePage } from '../../pages/profile.page';
import { ShellPage } from '../../pages/shell.page';

// Acceptance Test
// Traces to: L2-117, L2-001, L2-035, L2-036
// Description: anyone signed in edits the name and mobile of their own membership from Your account; the email, the role and a
// youth's name are shown read-only; invalid and failed saves keep what was typed.
test.describe('Edit your profile', () => {
  test('Given Jaylen on Your account, when he edits his name and mobile, then the toast confirms and the top bar shows the new name', async ({ page, api }) => {
    const account = new AccountPage(page);
    const profile = new ProfilePage(page);
    await account.open();
    await account.editProfile();

    await expect(profile.heading).toBeVisible();
    await expect(profile.name).toHaveValue('Jaylen Okafor');
    await expect(profile.email).toHaveValue('jaylen@harbourview.example');
    await expect(profile.email).toHaveAttribute('readonly', '');
    await expect(profile.helpFor('email')).toHaveText('You sign in with this email in every organization. Ask an admin to change it.');
    await expect(profile.managed).toContainText('Site lead');
    await expect(profile.managed).toContainText('Harbourview Youth Collective');
    await profile.expectAccessible();
    await profile.expectNoHorizontalScroll();

    await profile.save('Jaylen O. Okafor', '905-555-0182');

    await expect(profile.saved).toBeVisible();
    expect(await new ShellPage(page).accountButtonName()).toContain('Jaylen O. Okafor');
    expect(api.profileOf('m-jaylen')).toEqual({ name: 'Jaylen O. Okafor', mobile: '905-555-0182' });
    await profile.back();
    await expect(account.profile).toContainText('905-555-0182');
  });

  test('Given an empty name and a mobile without its area code, when Jaylen saves, then the errors show inline with a summary and nothing changes', async ({ page, api }) => {
    const profile = new ProfilePage(page);
    await profile.open();

    await profile.save('', '555-0181');

    await expect(profile.summary).toBeVisible();
    await expect(profile.fieldError('name')).toHaveText('Enter your name.');
    await expect(profile.fieldError('mobile')).toHaveText('Include the area code, like 905-555-0101.');
    expect(api.profileOf('m-jaylen')).toEqual({ name: 'Jaylen Okafor', mobile: null });
    await profile.expectAccessible();
  });

  test('Given the save fails, when Jaylen saves, then the form keeps what he typed and says nothing changed', async ({ page, api }) => {
    const profile = new ProfilePage(page);
    await profile.open();
    api.failNext('/api/me/profile', 500);

    await profile.save('Jaylen O. Okafor', null);

    await expect(profile.failed).toBeVisible();
    await expect(profile.name).toHaveValue('Jaylen O. Okafor');
    await profile.expectAccessible();
  });

  test('Given the profile fails to load, then the page says so and Try again reloads it', async ({ page, api }) => {
    api.failNext('/api/me/account', 500);
    const profile = new ProfilePage(page);
    await profile.open();

    await expect(profile.loadError).toBeVisible();
    api.recover('/api/me/account');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(profile.name).toHaveValue('Jaylen Okafor');
  });

  test.describe('as a youth', () => {
    test.use({ signedInAs: 'm-sofia' });

    test('Given Sofía, then her name is read-only from her record and she can add a mobile', async ({ page, api }) => {
      const profile = new ProfilePage(page);
      await profile.open();

      await expect(profile.name).toHaveAttribute('readonly', '');
      await expect(profile.helpFor('name')).toHaveText('Your name comes from your record at Harbourview Youth Collective. Ask staff to change it.');
      await profile.save(null, '905-555-0123');

      await expect(profile.saved).toBeVisible();
      expect(api.profileOf('m-sofia')).toEqual({ name: 'Sofía Rivera', mobile: '905-555-0123' });
      await profile.expectAccessible();
    });
  });

  test.describe('as a mentor on a phone', () => {
    test.use({ signedInAs: 'm-daniel', viewport: { width: 360, height: 800 } });

    test('Given Daniel on a phone, when he saves his profile, then nothing scrolls sideways and it is saved', async ({ page, api }) => {
      const profile = new ProfilePage(page);
      await profile.open();
      await profile.expectNoHorizontalScroll();

      await profile.save('Daniel Osei', '905-555-0144');

      await expect(profile.saved).toBeVisible();
      expect(api.profileOf('m-daniel').mobile).toBe('905-555-0144');
    });
  });

  test.describe('at two organizations', () => {
    test.use({ signedInAs: 'm-priya-hyc' });

    test('Given Priya saves her profile at Harbourview, then her Northgate membership keeps its own name', async ({ page, api }) => {
      const profile = new ProfilePage(page);
      await profile.open();

      await profile.save('Priya R. Raman', null);

      await expect(profile.saved).toBeVisible();
      expect(api.profileOf('m-priya-hyc').name).toBe('Priya R. Raman');
      expect(api.profileOf('m-priya-ngk').name).toBe('Priya Raman');
    });
  });
});
