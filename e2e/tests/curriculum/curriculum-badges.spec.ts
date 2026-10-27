import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { CurriculumBadgePage } from '../../pages/curriculum-badge.page';
import { CurriculumPage } from '../../pages/curriculum.page';

// Acceptance test. Traces to: L2-084 criteria 1 to 7 (badges: the list, the builder, refusals, delete, roles, tenants and the Learning gate).
const ON: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning'];

test.describe('Authoring badges', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given Harbourview’s badges, when Marisol opens Badges from Curriculum, then each badge shows how it is earned and how many youth hold it', async ({ page }) => {
    const curriculum = new CurriculumPage(page);
    const badges = new CurriculumBadgePage(page);
    await curriculum.openLoaded();

    await curriculum.openBadges();

    await badges.expectOpen('Badges');
    expect(await badges.badgeNames()).toEqual(['First Steps', 'Servant Heart', 'Quiz Champion', 'Served Someone', 'Speaks Up', 'Encourager']);
    expect(await badges.badgeMetas()).toEqual([
      'Completes a lesson · Pick Up the Towel · earned by 2 youth',
      'Completes a module · Leading by Serving · Serves others · earned by 1 youth',
      'Passes a quiz · Leading by Serving quiz · earned by 0 youth',
      'Has an assignment accepted · Serve someone this week · Serves others · earned by 1 youth',
      'A program director awards it · Speaks up · earned by 1 youth',
      'A program director awards it · earned by 0 youth',
    ]);
    await expect(badges.kpi('badges')).toContainText('6');
    await expect(badges.kpi('badges')).toContainText('4 automatic · 2 by hand');
    await expect(badges.kpi('awarded')).toContainText('5');
    await expect(badges.kpi('awarded')).toContainText('to 2 youth');
    await expect(badges.kpi('most-earned')).toContainText('First Steps');
    await badges.expectAccessible();
  });

  test('Given New badge, when Marisol creates an automatic badge for a module, then it opens with its preview and joins the list', async ({ page }) => {
    const badges = new CurriculumBadgePage(page);
    await badges.openList();
    await badges.expectOpen('Badges');
    await badges.newBadge();
    await badges.expectOpen('New badge');
    await badges.expectAccessible();

    await badges.fill({
      name: 'Knows Themselves',
      description: 'Finished Knowing Yourself.',
      icon: 'Book',
      kind: 'Automatically, by a rule',
      rule: 'Completes a module',
      target: 'Leadership Foundations · Knowing Yourself',
      competency: 'Speaks up',
    });
    await expect(badges.preview).toContainText('Knows Themselves');
    await badges.save();

    await badges.expectOpen('Knows Themselves');
    await expect(badges.toast).toContainText('Badge saved');
    await expect(badges.earnedByTitle).toHaveText('Earned by (0)');
    await expect(badges.awardButton).toHaveCount(0);
    await badges.expectAccessible();
    await badges.openList();
    await expect(badges.badges).toContainText('Completes a module · Knowing Yourself · Speaks up · earned by 0 youth');
  });

  test('Given an automatic badge with no name and no module, when Marisol saves, then the errors show beside the fields and in the summary', async ({ page }) => {
    const badges = new CurriculumBadgePage(page);
    await badges.openNew();
    await badges.expectOpen('New badge');

    await badges.fill({
      name: '',
      kind: 'Automatically, by a rule',
      rule: 'Completes a module',
    });
    await badges.save();

    await expect(badges.fieldError('name')).toHaveText('Give the badge a name.');
    await expect(badges.fieldError('target')).toHaveText('Choose the module that earns it.');
    await expect(badges.errorSummary).toBeFocused();
    await badges.expectAccessible();
  });

  test('Given Speaks Up, when Marisol renames it and saves, then a toast confirms and the name is kept', async ({ page, api }) => {
    const badges = new CurriculumBadgePage(page);
    await badges.openBadge('b-speaks');
    await badges.expectOpen('Speaks Up');
    await expect(badges.earnedBy).toContainText('Sofía Rivera');
    await expect(badges.earnedBy).toContainText('Awarded by Marisol Delgado');
    await badges.expectAccessible();

    await badges.fill({ name: 'Speaks Up Bravely' });
    await badges.save();

    await expect(badges.toast).toContainText('Badge saved');
    await expect.poll(() => api.badges.find('b-speaks')?.name).toBe('Speaks Up Bravely');
  });

  test('Given the save fails, when Marisol saves a badge, then the alert shows and her changes stay', async ({ page, api }) => {
    const badges = new CurriculumBadgePage(page);
    await badges.openBadge('b-speaks');
    await badges.expectOpen('Speaks Up');
    api.failNext('/api/curriculum/badges/b-speaks', 500);

    await badges.fill({ name: 'Speaks Up Loudly' });
    await badges.save();

    await expect(badges.failedAlert).toBeVisible();
    await expect(badges.name).toHaveValue('Speaks Up Loudly');
  });

  test('Given Encourager, when Marisol deletes it, then it leaves the list and a toast says youth keep it', async ({ page }) => {
    const badges = new CurriculumBadgePage(page);
    await badges.openBadge('b-encourager');
    await badges.expectOpen('Encourager');

    await badges.delete('Encourager');

    await badges.expectOpen('Badges');
    await expect(badges.toast).toContainText('Youth who earned Encourager keep it.');
    expect(await badges.badgeNames()).not.toContain('Encourager');
    expect(await badges.apiStatus('/api/curriculum/badges/b-encourager')).toBe(404);
  });

  test('Given no badges, when Marisol opens Badges, then the page offers New badge', async ({ page, api }) => {
    api.badges.clear('org-harbourview');
    const badges = new CurriculumBadgePage(page);

    await badges.openList();

    await expect(badges.noBadges).toBeVisible();
    await badges.expectAccessible();
  });

  test('Given Badges fails to load, when Marisol opens it, then the error state offers Try again', async ({ page, api }) => {
    api.failNext('/api/curriculum/badges', 500);
    const badges = new CurriculumBadgePage(page);

    await badges.openList();

    await expect(badges.errorState).toBeVisible();
    await badges.expectAccessible();
  });

  test('Given an unknown badge, when it is opened, then the page says it can’t be found', async ({ page }) => {
    const badges = new CurriculumBadgePage(page);

    await badges.openBadge('b-unknown');

    await expect(badges.notFound).toBeVisible();
    await badges.expectAccessible();
  });

  test('Given Learning is off, when Badges is opened directly, then Today opens and the badges endpoint answers 404', async ({ page, api }) => {
    api.setModules(
      'org-harbourview',
      ON.filter((m) => m !== 'Learning'),
    );
    const badges = new CurriculumBadgePage(page);

    await badges.openList();

    await expect(page).toHaveURL(/\/$/);
    expect(await badges.apiStatus('/api/curriculum/badges')).toBe(404);
  });

  test('Given a phone, when Marisol opens a badge, then nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const badges = new CurriculumBadgePage(page);

    await badges.openBadge('b-servant');
    await badges.expectOpen('Servant Heart');

    await badges.expectNoHorizontalScroll();
    await badges.expectAccessible();
  });
});

test.describe('Badges for other roles and organizations', () => {
  test('Given Jaylen, a site lead, when he opens Badges, then the page says program directors write the curriculum', async ({ page }) => {
    const badges = new CurriculumBadgePage(page);

    await badges.openList();

    await expect(badges.forbidden).toBeVisible();
    expect(await badges.apiStatus('/api/curriculum/badges')).toBe(403);
    await badges.expectAccessible();
  });

  test.describe('at Northgate', () => {
    test.use({ signedInAs: 'm-grace' });

    test('Given Learning is on at Northgate, when Grace opens a Harbourview badge, then it answers 404', async ({ page, api }) => {
      api.setModules('org-northgate', ['Roster', 'RollCall', 'QuickCards', 'Learning']);
      const badges = new CurriculumBadgePage(page);

      await badges.openBadge('b-speaks');

      await expect(badges.notFound).toBeVisible();
      expect(await badges.apiStatus('/api/curriculum/badges/b-speaks')).toBe(404);
    });
  });
});
