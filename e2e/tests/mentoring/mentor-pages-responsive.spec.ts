import { test } from '../../fixtures/test';
import { MentoringPage } from '../../pages/mentoring.page';
import { MentorGroupPage } from '../../pages/mentor-group.page';
import { MentorYouthDetailPage } from '../../pages/mentor-youth-detail.page';
import { MentorYouthPage } from '../../pages/mentor-youth.page';

// Acceptance tests. Traces to: L2-063 criterion 10, L2-064 criterion 8, L2-065 criterion 6: no horizontal scroll from 360px to 1440px.
test.describe('Mentor pages at every width', () => {
  test.use({ signedInAs: 'm-daniel' });

  for (const width of [360, 768, 1440]) {
    test(`Given a ${width}px viewport, when each mentor page renders, then nothing scrolls sideways`, async ({ page, api }) => {
      api.assignYouthMentor('c-mateo', 'm-daniel');
      api.setCohortTeam('p-sports', 'm-daniel');
      api.setCohortTeam('p-tutoring', 'm-hana', ['m-daniel']);
      api.recordAttendance('e-tutoring-today', 'c-mateo', 'Present', '2026-11-05T21:02:00Z');
      await page.setViewportSize({ width, height: 800 });
      const mentoring = new MentoringPage(page);
      const myYouth = new MentorYouthPage(page);
      const record = new MentorYouthDetailPage(page);
      const group = new MentorGroupPage(page);

      await mentoring.open();
      await mentoring.expectOpen();
      await mentoring.expectNoHorizontalScroll();
      await myYouth.open();
      await myYouth.expectOpen();
      await myYouth.expectNoHorizontalScroll();
      await record.open('c-mateo');
      await record.expectOpen('Mateo Rivera');
      await record.expectNoHorizontalScroll();
      await group.open('p-tutoring');
      await group.expectOpen('After-School Tutoring');
      await group.expectNoHorizontalScroll();
    });
  }
});
