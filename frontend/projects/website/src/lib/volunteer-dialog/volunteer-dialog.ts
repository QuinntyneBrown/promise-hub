import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VOLUNTEER_AREAS, WEBSITE_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhCheckbox,
  PhDialog,
  PhErrorSummary,
  PhSelect,
  PhTextField,
  PhTextarea,
} from '@promisehub/components';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  name: 'vol-name',
  email: 'vol-email',
  phone: 'vol-phone',
  area: 'vol-area',
  about: 'vol-about',
  screeningAcknowledged: 'vol-ack',
};

/** Sign up to volunteer (dialog: volunteer-interest, L2-134 criterion 2). Opened with the site's address; closes with true once sent. */
@Component({
  selector: 'ph-volunteer-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCheckbox,
    PhDialog,
    PhErrorSummary,
    PhSelect,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './volunteer-dialog.html',
})
export class VolunteerDialog {
  private readonly api = inject(WEBSITE_API);
  private readonly slug = inject<string>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly areas = [...VOLUNTEER_AREAS];

  protected name = '';
  protected email = '';
  protected phone = '';
  protected area: string = VOLUNTEER_AREAS[0];
  protected readonly about = signal('');
  protected acknowledged = false;
  protected readonly count = computed(
    () => `${this.about().length.toLocaleString('en-US')} / 1,000`,
  );
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly problem = signal<'failed' | 'too-many' | null>(null);
  protected readonly busy = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.problem.set(null);
    this.errors.set({});
    this.api
      .volunteer(this.slug, {
        name: this.name,
        email: this.email,
        phone: this.phone.trim() || null,
        area: this.area,
        about: this.about().trim() || null,
        screeningAcknowledged: this.acknowledged,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'sent') this.ref.close(true);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else if (outcome.status === 'too-many') this.problem.set('too-many');
        else this.problem.set('failed');
      });
  }
}
