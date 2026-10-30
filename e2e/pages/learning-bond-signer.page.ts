import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The named signer's own page behind the emailed link, with no sign-in (mock: learning-bond-agreement, states signer to signer-unknown). */
export class LearningBondSignerPage extends BasePage {
  /**
   * Starts recording whether the browser loads the Learning Bond library, to prove the signer's page never needs it. Chunk names carry no
   * library name, so each script is read for the library's source path, which the development build keeps.
   */
  recordLibraryLoads(): { loaded: boolean } {
    const record = { loaded: false };
    this.page.on('response', async (response) => {
      if (response.request().resourceType() !== 'script') return;
      const body = await response.text().catch(() => '');
      if (body.includes('projects/learning-bond/src/')) record.loaded = true;
    });
    return record;
  }

  async openLink(token: string): Promise<void> {
    await super.open(`/sign/learning-bond/${token}`);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** Who asked, and as what: "Grace Mensah asked you, as Board chair, to accept it. No PromiseHub account is needed." */
  get requestedBy(): Locator {
    return this.page.getByTestId('signer-requested-by');
  }

  async sectionTitles(): Promise<string[]> {
    return (await this.page.getByTestId('agreement-text').getByRole('heading', { level: 2 }).allInnerTexts()).map((t) => t.trim());
  }

  authority(name: string, organization: string): Locator {
    return this.page.getByRole('checkbox', { name: `I, ${name}, have authority to accept this agreement for ${organization}` });
  }

  get authorityError(): Locator {
    return this.page.getByTestId('authority-error');
  }

  get acceptButton(): Locator {
    return this.page.getByRole('button', { name: 'Accept', exact: true });
  }

  async accept(): Promise<void> {
    await this.acceptButton.click();
  }

  /** The success alert once the signer has accepted. */
  get accepted(): Locator {
    return this.page.getByTestId('signer-accepted');
  }

  /** The explanation under "This link has expired". */
  get expired(): Locator {
    return this.page.getByTestId('signer-expired');
  }

  get tryAgain(): Locator {
    return this.page.getByRole('button', { name: 'Try again' });
  }

  async expectExpired(text: string): Promise<void> {
    await expect(this.heading).toHaveText('This link has expired');
    await expect(this.expired).toHaveText(text);
  }
}
