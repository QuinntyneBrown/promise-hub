import { test, expect } from '../../fixtures/test';
import { MessagePage } from '../../pages/message.page';
import { MessagesPage } from '../../pages/messages.page';
import { NewMessagePage } from '../../pages/new-message.page';
import { TodayPage } from '../../pages/today.page';

// L2-021 composing and sending, L2-022 SMS cap, L2-007 roles, L2-005 Messages off, L2-035/L2-036 accessibility and phone layout.
test.describe('Send guardian messages as a program director', () => {
  test.use({ signedInAs: 'm-marisol' });

  test('Given nothing sent yet, when Messages opens, then it offers a new message', async ({ page }) => {
    const messages = new MessagesPage(page);

    await messages.open();

    await expect(messages.emptyState).toBeVisible();
    await messages.expectAccessible();
    await messages.newMessage();
  });

  test('Given the tutoring program, when the message is written, then the count, channels and SMS preview follow', async ({ page }) => {
    const compose = new NewMessagePage(page);
    await compose.open();

    await compose.audience('After-School Tutoring');
    await compose.write('Reminder: RBG trip is Sat 14 Nov. Bus leaves 8:45 am sharp.');

    await compose.expectCount(3);
    await expect(compose.recipientCount).toContainText('3 by text, 0 by email');
    await expect(compose.smsPreview).toHaveText('Harbourview Youth Collective: Reminder: RBG trip is Sat 14 Nov. Bus leaves 8:45 am sharp.');
    await compose.language('Spanish');
    await compose.expectCount(1);
    await compose.expectAccessible();
    await compose.expectNoHorizontalScroll();
  });

  test('Given a written message, when it is sent, then each household’s delivery is shown and it is listed', async ({ page }) => {
    const compose = new NewMessagePage(page);
    await compose.open();
    await compose.audience('After-School Tutoring');
    await compose.write('Reminder: RBG trip is Sat 14 Nov. Bus leaves 8:45 am sharp.');
    await compose.expectCount(3);

    await compose.send();

    const message = new MessagePage(page);
    await expect(message.heading).toHaveText('Reminder: RBG trip is Sat 14 Nov.');
    await expect(page.getByRole('status').filter({ hasText: 'Message sent' })).toContainText('3 guardians');
    await expect(message.kpi('Delivered')).toHaveText('3');
    await expect(message.deliveryRows).toHaveCount(3);
    await expect(message.delivery('Rivera')).toContainText('Text (Spanish)');
    await expect(message.delivery('Rivera')).toContainText('Sent');
    await message.expectAccessible();

    const messages = new MessagesPage(page);
    await messages.open();
    await expect(messages.row('Reminder: RBG trip is Sat 14 Nov.')).toContainText('Delivered');
  });

  test('Given a household without email, when an email-only message is sent, then it is shown as failed with the reason', async ({ page }) => {
    const compose = new NewMessagePage(page);
    await compose.open();
    await compose.audience('Saturday Sports');
    await compose.write('The gym is closed this Saturday.');
    await compose.sendBy('Email only');
    await expect(compose.recipientCount).toContainText('1 can’t be reached');

    await compose.send();

    const message = new MessagePage(page);
    await expect(message.kpi('Failed')).toHaveText('1');
    await expect(message.delivery('Tran')).toContainText('Failed');
    await expect(message.delivery('Tran')).toContainText('No email address');
  });

  test('Given an empty message, when Send is pressed, then the composer asks for the message', async ({ page }) => {
    const compose = new NewMessagePage(page);
    await compose.open();
    await compose.audience('After-School Tutoring');
    await compose.expectCount(3);

    await compose.send();

    await expect(compose.bodyError).toHaveText('Enter a message.');
    await compose.expectAccessible();
  });

  test('Given the count fails, when the composer opens, then it says so and Send stays off', async ({ page, api }) => {
    api.failNext('/api/messages/preview', 500);
    const compose = new NewMessagePage(page);

    await compose.open();

    await expect(compose.alert('We couldn’t count recipients')).toBeVisible();
    await expect(compose.sendButton).toBeDisabled();
  });

  test('Given one segment left this month, when texts are previewed, then the composer warns how many get email instead', async ({ page, api }) => {
    api.setSmsUsed('org-harbourview', 1999);
    const compose = new NewMessagePage(page);
    await compose.open();

    await compose.audience('After-School Tutoring');
    await compose.write('Reminder: RBG trip is Sat 14 Nov.');

    await expect(compose.countWarning).toHaveText('This passes the SMS cap: 2 households get email instead.');
  });

  test('Given the SMS cap is reached, when a message is sent, then texts are off and email still goes', async ({ page, api }) => {
    api.setSmsUsed('org-harbourview', 2000);
    const compose = new NewMessagePage(page);
    await compose.open();

    await expect(compose.alert('You’ve used all 2,000 SMS segments this month')).toBeVisible();
    await expect(compose.channel(/^Text, email/)).toBeDisabled();
    await expect(compose.channel('Email only')).toBeChecked();
    await compose.audience('After-School Tutoring');
    await compose.write('Reminder: RBG trip is Sat 14 Nov.');
    await compose.expectAccessible();
    await compose.send();

    const message = new MessagePage(page);
    await expect(message.kpi('Delivered')).toHaveText('3');
    await expect(message.delivery('Thompson')).toContainText('Email');
    const messages = new MessagesPage(page);
    await messages.open();
    await expect(messages.capAlert).toBeVisible();
  });
});

test.describe('Messages for other roles and modules', () => {
  test.describe('as a youth worker', () => {
    test.use({ signedInAs: 'm-aisha' });

    test('Given Messages, when a youth worker opens it, then she sees she has no access', async ({ page }) => {
      const messages = new MessagesPage(page);

      await messages.open();

      await expect(messages.heading).toHaveText('Messages are for directors and site leads');
      await messages.expectAccessible();
    });
  });

  test('Given Messages is off, when it is opened directly, then Today opens', async ({ page, api }) => {
    api.setModules('org-harbourview', ['Roster', 'RollCall', 'QuickCards']);

    await page.goto('/messages/new');

    await expect(page).toHaveURL(/\/$/);
    await expect(new TodayPage(page).heading).toBeVisible();
  });
});
