import { test, expect } from '../../fixtures/test';
import { MentorGradePage } from '../../pages/mentor-grade.page';
import { MentorReviewsPage } from '../../pages/mentor-reviews.page';
import { waitingWork } from '../../fixtures/mentor-work';

// Acceptance test. Traces to: L2-080 criteria 2 to 8 (opening, scoring against the rubric, draft, approve, revise, invalid, failed, leaving
// with unsaved changes, not found), L2-083 criterion 1 (a stale grade keeps the entries and offers the latest), L2-035.
const TASK = 'Serve someone this week';
const SOFIA = 'sub-2';

test.describe('Grading a submission', () => {
  test.use({ signedInAs: 'm-daniel' });

  test.beforeEach(({ api }) => waitingWork(api));

  test('Given Sofía’s submission, when Daniel opens it from Reviews, scores every criterion and approves, then it is Accepted with 25 of 25 points', async ({ page, api }) => {
    const reviews = new MentorReviewsPage(page);
    const grade = new MentorGradePage(page);
    await reviews.open();

    await reviews.review('Sofía Rivera', TASK);

    await grade.expectOpen(TASK);
    await expect(grade.status).toHaveText('In review');
    await expect(grade.subtitle).toContainText('Sofía Rivera · Leading by Serving');
    await expect(grade.sent).toContainText('stack the chairs');
    await expect(grade.total).toHaveText('Total: 0 / 25');
    await grade.expectAccessible();
    await grade.scoreAll([10, 10, 5]);
    await expect(grade.total).toHaveText('Total: 25 / 25');
    await grade.comment.fill('This is exactly it, Sofía. Serving is noticing what needs doing.');
    await grade.approve();
    await expect(grade.dialog).toContainText('Approve Sofía’s submission?');
    await expect(grade.dialog).toContainText('Serve someone this week · 25 of 25 points');
    await grade.expectAccessible();
    await grade.confirm('Approve');

    await expect(grade.status).toHaveText('Accepted');
    await expect(grade.alert('Approved')).toContainText('Sofía sees 25 of 25 points and your comment.');
    await expect(grade.outcome).toContainText('25 / 25');
    expect(api.learningState.work.all().find((s) => s.id === SOFIA)!.status).toBe('Accepted');
    await grade.expectNoHorizontalScroll();
    await grade.backToReviews();
    await expect(reviews.rows).toHaveCount(2);
  });

  test('Given a criterion is blank and another is over its points, when he approves, then the errors show inline and in a summary and nothing is sent', async ({ page, api }) => {
    const grade = new MentorGradePage(page);
    await grade.open(SOFIA);

    await grade.scoreAll([12, 10, null]);
    await grade.approve();

    await expect(grade.errorSummary).toContainText('Give 0 to 10 points.');
    await expect(grade.errorSummary).toContainText('Score this criterion before you approve.');
    await expect(grade.dialog).toHaveCount(0);
    await expect(grade.status).toHaveText('In review');
    expect(api.learningState.work.all().find((s) => s.id === SOFIA)!.status).toBe('InReview');
    await grade.expectAccessible();
  });

  test('Given he asks for a revision, when the note is blank it is required, and when sent the submission needs revision', async ({ page, api }) => {
    const grade = new MentorGradePage(page);
    await grade.open(SOFIA);
    await grade.scoreAll([10, 8, 2]);

    await grade.requestRevision();
    await grade.revisionNote.fill('');
    await grade.confirm('Send request');
    await expect(grade.dialog).toContainText('Write what they should change.');
    await grade.expectAccessible();
    await grade.revisionNote.fill('Great story, Sofía! Can you add a line about one thing you noticed?');
    await grade.confirm('Send request');

    await expect(grade.status).toHaveText('Needs revision');
    await expect(grade.alert('Sent back to Sofía')).toBeVisible();
    const s = api.learningState.work.all().find((x) => x.id === SOFIA)!;
    expect(s.status).toBe('NeedsRevision');
    expect(s.feedback).toBe('Great story, Sofía! Can you add a line about one thing you noticed?');
  });

  test('Given scores and a comment, when he saves a draft and comes back, then they are kept and Sofía still sees In review', async ({ page, api }) => {
    const grade = new MentorGradePage(page);
    await grade.open(SOFIA);
    await grade.scoreAll([10, 8, null]);
    await grade.comment.fill('Strong start.');

    await grade.saveDraft();

    await expect(grade.toast('Draft saved')).toBeVisible();
    await grade.open(SOFIA);
    await expect(grade.score('Described what they did and how it felt')).toHaveValue('8');
    await expect(grade.comment).toHaveValue('Strong start.');
    await expect(grade.status).toHaveText('In review');
    expect(api.learningState.work.all().find((s) => s.id === SOFIA)!.feedback).toBeNull();
  });

  test('Given Hana saved a grade after Daniel opened it, when he approves, then his entries stay and Load the latest shows hers', async ({ page, api }) => {
    const grade = new MentorGradePage(page);
    await grade.open(SOFIA);
    await expect(grade.status).toHaveText('In review');
    api.reviews.otherMentorSaved(SOFIA, 'Hana’s draft note.');
    await grade.scoreAll([10, 10, 5]);
    await grade.comment.fill('Lovely.');

    await grade.approve();
    await grade.confirm('Approve');

    await expect(grade.alert('This submission changed after you opened it')).toBeVisible();
    await expect(grade.comment).toHaveValue('Lovely.');
    await expect(grade.status).toHaveText('In review');
    await grade.expectAccessible();
    await grade.loadLatest();
    await expect(grade.comment).toHaveValue('Hana’s draft note.');
  });

  test('Given the save fails, when he approves, then the dialog says so and keeps everything', async ({ page, api }) => {
    const grade = new MentorGradePage(page);
    await grade.open(SOFIA);
    await grade.scoreAll([10, 10, 5]);
    api.failNext(`/api/mentoring/submissions/${SOFIA}/grade`, 500);

    await grade.approve();
    await grade.confirm('Approve');

    await expect(grade.dialog).toContainText('That didn’t go through');
    await grade.expectAccessible();
    await grade.confirm('Cancel');
    await expect(grade.total).toHaveText('Total: 25 / 25');
  });

  test('Given unsaved scores, when he leaves, then leave-grade asks first; Keep editing stays and Leave without saving goes', async ({ page }) => {
    const grade = new MentorGradePage(page);
    const reviews = new MentorReviewsPage(page);
    await grade.open(SOFIA);
    await grade.scoreAll([10, null, null]);

    await grade.backToReviews();
    await expect(grade.dialog).toContainText('Leave without saving your grade?');
    await grade.expectAccessible();
    await grade.confirm('Keep editing');
    await expect(grade.score('Chose someone and served without being asked')).toHaveValue('10');

    await grade.backToReviews();
    await grade.confirm('Leave without saving');
    await reviews.expectOpen();
  });

  test('Given a submission that isn’t one of his youth’s, when he opens it, then it is not found', async ({ page }) => {
    const grade = new MentorGradePage(page);

    await grade.open('sub-unknown');

    await expect(grade.notFound).toBeVisible();
    expect(await grade.apiStatus('sub-unknown')).toBe(404);
    await grade.expectAccessible();
  });
});
