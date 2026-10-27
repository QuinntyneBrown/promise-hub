import { test, expect } from '../../fixtures/test';
import { GuardianEnrollPage } from '../../pages/guardian-enroll.page';

// Acceptance Test
// Traces to: L2-071 (applying or referring a young person), L2-013, L2-026, L2-005 Roster off, L2-035 accessibility.
test.describe('Apply as a young person', () => {
  test.use({ signedInAs: null });

  test('Given Malik, 14, when he applies for himself with his mother’s contact, then he waits for review and she is to be asked for consent', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    const enroll = new GuardianEnrollPage(page);
    await enroll.open(slug);
    await expect(enroll.applyingAs('I’m a parent or guardian')).toBeChecked();

    await enroll.applyAs('I’m the young person');
    await enroll.expectAccessible();
    await enroll.verify('905-555-0311', api.guardianCode);

    await expect(enroll.heading).toHaveText('About you');
    await enroll.next();
    await expect(enroll.fieldError('youth-first')).toHaveText('Enter the young person’s first and last name.');
    await expect(enroll.fieldError('youth-reason')).toHaveText('Tell us why you’re interested.');
    await enroll.fillYoungPerson({ firstName: 'Malik', lastName: 'Johnson', dateOfBirth: '2012-04-18', reason: 'I want to learn to code and help with the younger kids.' });
    await enroll.expectAccessible();
    await enroll.next();

    await expect(enroll.heading).toHaveText('Your parent or guardian');
    await enroll.next();
    await expect(enroll.fieldError('guardianName')).toHaveText('Enter your parent or guardian’s name.');
    await enroll.field('Guardian’s full name').fill('Denise Johnson');
    await enroll.field('Guardian’s mobile number').fill('905-555-0310');
    await enroll.next();

    await expect(enroll.heading).toHaveText('Check and submit');
    await expect(enroll.text('Malik Johnson', { exact: true })).toBeVisible();
    await expect(enroll.text('Denise Johnson · 905-555-0310')).toBeVisible();
    await enroll.expectAccessible();
    await enroll.next('Submit');
    await expect(enroll.text('Agree to the privacy notice to submit.')).toBeVisible();
    await enroll.agree(/privacy notice/);
    await enroll.next('Submit');

    await expect(enroll.heading).toHaveText('Thank you, Malik');
    await expect(enroll.text('Malik is waiting for review.')).toBeVisible();
    await expect(enroll.text('We’ll ask Denise Johnson to give consent before you start.')).toBeVisible();
    expect(api.lastEnrollmentRequest()).toMatchObject({ appliedAs: 'Youth', seasonConsent: false, reason: 'I want to learn to code and help with the younger kids.' });
    await enroll.expectAccessible();
    await enroll.expectNoHorizontalScroll();
  });

  test('Given a ten-year-old, when they try to apply for themselves, then they are asked to have a parent or guardian apply', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    const enroll = new GuardianEnrollPage(page);
    await enroll.open(slug);
    await enroll.applyAs('I’m the young person');
    await enroll.verify('905-555-0311', api.guardianCode);

    await enroll.fillYoungPerson({ firstName: 'Eli', lastName: 'Park', dateOfBirth: '2016-02-10', reason: 'My friends go.' });
    await enroll.next();

    await expect(enroll.fieldError('youth-dob')).toHaveText('Young people aged 12 to 18 can apply for themselves. Ask a parent or guardian to apply for you.');
    await expect(enroll.heading).toHaveText('About you');
  });
});

test.describe('Refer a young person', () => {
  test.use({ signedInAs: null });

  test('Given Rachel, a guidance counsellor, when she refers Zoe with her guardian’s contact, then the referral waits for review and the family will be contacted', async ({ page, api }) => {
    const slug = api.openEnrollment('p-winter');
    const enroll = new GuardianEnrollPage(page);
    await enroll.open(slug);

    await enroll.applyAs('I’m referring a young person');
    await enroll.verify('rachel.ellis@bennetto.example.ca', api.guardianCode);

    await expect(enroll.heading).toHaveText('About you');
    await expect(enroll.text('rachel.ellis@bennetto.example.ca')).toBeVisible();
    await enroll.next();
    await expect(enroll.fieldError('referrerName')).toHaveText('Enter your full name.');
    await expect(enroll.fieldError('referrerRole')).toHaveText('Tell us how you know the young person.');
    await enroll.field('Your full name').fill('Rachel Ellis');
    await enroll.field('Your role').fill('Guidance counsellor');
    await enroll.field('School or organization (optional)').fill('Bennetto Elementary');
    await enroll.expectAccessible();
    await enroll.next();

    await expect(enroll.heading).toHaveText('The young person');
    await enroll.fillYoungPerson({ firstName: 'Zoe', lastName: 'Campbell', dateOfBirth: '2013-01-20', reason: 'Zoe is curious and kind, and needs somewhere to belong after school.' });
    await enroll.next();

    await expect(enroll.heading).toHaveText('Their parent or guardian');
    await enroll.field('Guardian’s full name').fill('Tanya Campbell');
    await enroll.field('Guardian’s mobile number').fill('905-555-0320');
    await enroll.next();

    await expect(enroll.heading).toHaveText('Check and submit');
    await expect(enroll.text('Rachel Ellis · Guidance counsellor, Bennetto Elementary')).toBeVisible();
    await expect(enroll.text('Zoe Campbell', { exact: true })).toBeVisible();
    await enroll.expectAccessible();
    await enroll.next('Submit');
    await expect(enroll.text('Confirm the family agrees to be contacted.')).toBeVisible();
    await enroll.agree(/agrees to be contacted/);
    await enroll.next('Submit');

    await expect(enroll.heading).toHaveText('Thank you, Rachel');
    await expect(enroll.text('Zoe is waiting for review.')).toBeVisible();
    await expect(enroll.text('We’ll contact Tanya Campbell about next steps.')).toBeVisible();
    expect(api.lastEnrollmentRequest()).toMatchObject({
      appliedAs: 'Referrer',
      seasonConsent: false,
      referrer: { name: 'Rachel Ellis', role: 'Guidance counsellor', organization: 'Bennetto Elementary', contact: 'rachel.ellis@bennetto.example.ca' },
    });
    await enroll.expectAccessible();
    await enroll.expectNoHorizontalScroll();
  });
});
