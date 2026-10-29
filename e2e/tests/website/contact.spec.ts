import { test, expect } from '../../fixtures/test';
import type { ModuleId } from '../../fixtures/seed';
import { SiteContactPage } from '../../pages/site-contact.page';

// Acceptance Test
// Traces to: L2-134 criteria 1, 4, 5 and 6, L2-132 criterion 5
// Description: a visitor writes to the organization from the contact page: errors inline with a summary, the acknowledgement once sent,
// what was typed kept when the send fails, a kind refusal after five messages in an hour, and not found while the module is off.
const SUITE: ModuleId[] = ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports'];
const DANA = {
  name: 'Dana Thompson',
  email: 'dana.t@example.com',
  topic: 'Programs and enrollment',
  message: 'Is there still room in Saturday Sports for an 11-year-old?',
};

test.describe('Public website: contact', () => {
  test.use({ signedInAs: null });

  test.beforeEach(({ api }) => {
    api.setModules('org-harbourview', [...SUITE, 'PublicWebsite']);
    api.setWebsiteProfile('org-harbourview', { contactEmail: 'hello@harbourview.example' });
  });

  test('Given the contact page, when Dana sends her question, then it is stored for Harbourview and the page says what happens next', async ({
    page,
    api,
  }) => {
    const contact = new SiteContactPage(page);
    await contact.open();
    await expect(contact.heading).toHaveText('Get in touch');
    await expect(contact.findUs('email')).toContainText('hello@harbourview.example');
    await contact.expectAccessible();

    await contact.fill(DANA);
    await contact.send();

    await expect(contact.sent).toBeVisible();
    await expect(contact.acknowledgement).toContainText('Thanks, Dana.');
    expect(api.websiteRequests('org-harbourview', 'contact')).toEqual([
      expect.objectContaining({ email: 'dana.t@example.com', topic: 'Programs and enrollment' }),
    ]);
    await contact.expectAccessible();
  });

  test('Given an empty name, an email that is not one and no message, then the errors show inline with a summary and nothing is sent', async ({
    page,
    api,
  }) => {
    const contact = new SiteContactPage(page);
    await contact.open();

    await contact.fill({ name: '', email: 'dana@', message: '' });
    await contact.send();

    await expect(contact.summary).toBeVisible();
    await expect(contact.error('Your name')).toHaveText('Enter your name.');
    await expect(contact.error('Email')).toHaveText('Enter an email like name@example.com.');
    await expect(contact.error('Message')).toHaveText('Write your message.');
    expect(api.websiteRequests('org-harbourview', 'contact')).toEqual([]);
    await contact.expectAccessible();
  });

  test('Given the send fails, then what Dana typed is kept and she can try again', async ({ page, api }) => {
    api.failNext('/api/website/harbourview/contact', 500);
    const contact = new SiteContactPage(page);
    await contact.open();

    await contact.fill(DANA);
    await contact.send();

    await expect(contact.failed).toBeVisible();
    await expect(contact.fieldValue('Message')).toHaveValue(DANA.message);
    api.recover('/api/website/harbourview/contact');
    await contact.send();
    await expect(contact.sent).toBeVisible();
  });

  test('Given five messages from Dana within the hour, when she sends a sixth, then she is asked to wait and nothing is stored', async ({
    page,
    api,
  }) => {
    const contact = new SiteContactPage(page);
    await contact.open();
    for (let i = 0; i < 5; i++) api.addWebsiteRequest('org-harbourview', 'contact', DANA.email);

    await contact.fill(DANA);
    await contact.send();

    await expect(contact.tooMany).toBeVisible();
    expect(api.websiteRequests('org-harbourview', 'contact')).toHaveLength(5);
  });

  test('Given markup typed in the message, then it is sent and stored as plain text', async ({ page, api }) => {
    const contact = new SiteContactPage(page);
    await contact.open();

    await contact.fill({ ...DANA, message: '<img src=x onerror=alert(1)> Hello' });
    await contact.send();

    await expect(contact.sent).toBeVisible();
    expect(api.websiteRequests('org-harbourview', 'contact')[0]).toEqual(
      expect.objectContaining({ message: '<img src=x onerror=alert(1)> Hello' }),
    );
  });

  test('Given Public website is off, then the contact page is not found and the API answers 404', async ({ page, api }) => {
    api.setModules('org-harbourview', SUITE);
    const contact = new SiteContactPage(page);

    await contact.open();

    await expect(contact.notFound).toBeVisible();
    expect(
      await page.evaluate(
        async () =>
          (await fetch('/api/website/harbourview/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }))
            .status,
      ),
    ).toBe(404);
  });
});
