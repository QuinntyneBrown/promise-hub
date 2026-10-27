import { test, expect } from '../../fixtures/test';
import { CurriculumLessonPage } from '../../pages/curriculum-lesson.page';

// Acceptance test. Traces to: L2-067 criteria 7, 8 and 10 (a lesson video through file storage), L2-031.
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(64, 7)]);
const PDF = Buffer.from('%PDF-1.7 weekly schedule');

test.describe('Uploading a lesson video', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given a lesson without a video, when Marisol chooses an MP4, then it uploads and is listed with its size and Remove', async ({ page, api }) => {
    const lesson = new CurriculumLessonPage(page);
    await lesson.open('l-line');
    await lesson.expectOpen('Last in Line');
    await expect(lesson.chooseVideo).toBeVisible();
    await lesson.expectAccessible();
    const release = api.curriculumState.holdUploads();

    await lesson.attach('last-in-line.mp4', 'video/mp4', MP4);

    await expect(lesson.uploading).toBeVisible();
    await lesson.expectAccessible();
    release();
    await expect(lesson.attachedVideo).toContainText('last-in-line.mp4');
    await expect(lesson.attachedVideo).toContainText('76 bytes');
    await expect(lesson.toast).toContainText('Video attached');
    await page.reload();
    await lesson.expectOpen('Last in Line');
    await expect(lesson.attachedVideo).toContainText('last-in-line.mp4');
  });

  test('Given a PDF, when Marisol chooses it, then it is refused with the reason and the chooser stays', async ({ page }) => {
    const lesson = new CurriculumLessonPage(page);
    await lesson.open('l-line');
    await lesson.expectOpen('Last in Line');

    await lesson.attach('weekly-schedule.pdf', 'application/pdf', PDF);

    await expect(lesson.videoRefused).toContainText('“weekly-schedule.pdf” was not attached.');
    await expect(lesson.chooseVideo).toBeVisible();
    await expect(lesson.attachedVideo).toBeHidden();
    await lesson.expectAccessible();
  });

  test('Given the upload fails, when Marisol chooses a video, then the page says the upload didn’t finish', async ({ page, api }) => {
    const lesson = new CurriculumLessonPage(page);
    await lesson.open('l-line');
    await lesson.expectOpen('Last in Line');
    api.failNext('/api/curriculum/lessons/l-line/video', 500);

    await lesson.attach('last-in-line.mp4', 'video/mp4', MP4);

    await expect(lesson.uploadFailed).toBeVisible();
    await expect(lesson.chooseVideo).toBeVisible();
  });

  test('Given Pick Up the Towel has a video, when Marisol removes it, then the chooser returns', async ({ page }) => {
    const lesson = new CurriculumLessonPage(page);
    await lesson.open('l-towel');
    await lesson.expectOpen('Pick Up the Towel');
    await expect(lesson.attachedVideo).toContainText('pick-up-the-towel.mp4');
    await expect(lesson.attachedVideo).toContainText('184 MB');

    await lesson.removeVideo('pick-up-the-towel.mp4');

    await expect(lesson.chooseVideo).toBeVisible();
    await expect(lesson.toast).toContainText('Video removed');
  });
});
