import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ORGANIZATION_SETTINGS_API, WebsiteProfile } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhDialog,
  PhErrorSummary,
  PhTextField,
  PhTextarea,
} from '@promisehub/components';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  slug: 'site-slug',
  tagline: 'site-tagline',
  about: 'site-about',
  contactEmail: 'site-email',
};

/** Edit website profile (dialog: website-profile, L2-126). Closes with the saved address once saved. */
@Component({
  selector: 'ph-website-profile-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhErrorSummary, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './website-profile-dialog.html',
})
export class WebsiteProfileDialog {
  private readonly api = inject(ORGANIZATION_SETTINGS_API);
  private readonly current = inject<WebsiteProfile>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected slug = this.current.slug ?? '';
  protected tagline = this.current.tagline ?? '';
  protected readonly about = signal(this.current.about ?? '');
  protected contactEmail = this.current.contactEmail ?? '';
  protected readonly count = computed(
    () => `${this.about().length.toLocaleString('en-US')} / 1,000`,
  );
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    const slug = this.slug.trim();
    this.api
      .saveWebsite({
        slug,
        tagline: this.tagline,
        about: this.about().trim() || null,
        contactEmail: this.contactEmail.trim() || null,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(slug);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
