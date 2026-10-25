import { test, expect } from '../../fixtures/test';
import { CheckInPage } from '../../pages/check-in.page';
import { QuickCardPage } from '../../pages/quick-card.page';

// L2-019 Quick Card content and access, L2-007 roles, L2-029 phone, L2-005 module off, L2-035 accessibility.
test.describe('Read a Quick Card as a site lead', () => {
  test('Given Mateo on tonight’s roster, when his name is tapped, then the allergy alert comes first with who to call', async ({ page }) => {
    const checkIn = new CheckInPage(page);
    const card = new QuickCardPage(page);
    await checkIn.open();
    await checkIn.roster.getByRole('link', { name: 'Quick Card for Mateo Rivera' }).click();

    await card.expectShown('Mateo Rivera');
    expect(await card.firstBlock()).toBe('alert');
    await expect(card.alert).toContainText('Severe allergy: Peanuts (anaphylaxis); tree nuts (hives)');
    await expect(card.alert).toContainText('EpiPen in backpack front pocket');
    await expect(card.medical).toContainText('Ontario ···· 4471');
    await expect(card.callLink('Carmen Rivera')).toHaveAttribute('href', 'tel:905-555-0142');
    await expect(card.pickups).toContainText('Luis Rivera');
    await card.expectAccessible();
    await card.expectNoHorizontalScroll();
  });

  test('Given a child with no medical information, when the card opens, then it says so', async ({ page }) => {
    const card = new QuickCardPage(page);

    await card.open('/quick-cards/c-jordan');

    await card.expectShown('Jordan Thompson');
    await expect(card.empty).toBeVisible();
    await expect(card.callLink('Dana Thompson')).toHaveAttribute('href', 'tel:905-555-0117');
    await card.expectAccessible();
  });

  test('Given a child of another organization, when the card is opened, then it is not found', async ({ page }) => {
    const card = new QuickCardPage(page);

    await card.open('/quick-cards/c-ng-mateo');

    await expect(card.heading).toHaveText('We can’t find that Quick Card');
  });
});

test.describe('Quick Cards for other roles and modules', () => {
  test.describe('Volunteer coordinator', () => {
    test.use({ signedInAs: 'm-priya-hyc' });

    test('Given a volunteer coordinator, when Mateo’s card opens, then medical details are hidden but who to call is shown', async ({ page }) => {
      const card = new QuickCardPage(page);

      await card.open('/quick-cards/c-mateo');

      await card.expectShown('Mateo Rivera');
      await expect(card.restricted).toBeVisible();
      await expect(card.alert).toHaveCount(0);
      await expect(page.getByRole('main')).not.toContainText('Peanuts');
      await expect(card.callLink('Carmen Rivera')).toBeVisible();
      await card.expectAccessible();
    });
  });

  test('Given Quick Cards is off, when a card is opened directly, then Today opens and roster names are not links', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall']);

    await page.goto('/quick-cards/c-mateo');
    await expect(page).toHaveURL(/\/$/);

    const checkIn = new CheckInPage(page);
    await checkIn.open();
    await expect(checkIn.heading).toHaveText('Tutoring night');
    await expect(checkIn.roster.getByRole('link')).toHaveCount(0);
  });
});
