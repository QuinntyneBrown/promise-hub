import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A guardian's Learning Bond link while it answers 404 (mock: guardian-learning-bond, state unavailable). */
export class LearningBondUnavailablePage extends BasePage {
  /**
   * Starts recording whether the browser loads the Learning Bond library, to prove an off module's library is never downloaded. Chunk
   * names carry no library name, so each script is read for the library's source path, which the development build keeps.
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
    await super.open(`/g/learning-bond/${token}`);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get explanation(): Locator {
    return this.page.getByTestId('learning-bond-unavailable');
  }

  async expectShown(): Promise<void> {
    await expect(this.heading).toHaveText('Learning Bond isn’t available');
  }
}
