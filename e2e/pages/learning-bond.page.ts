import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The staff Learning Bond routes (/learning-bond); their screens arrive with prompt 83 onward. */
export class LearningBondPage extends BasePage {
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

  async openStaff(): Promise<void> {
    await super.open('/learning-bond');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }
}
