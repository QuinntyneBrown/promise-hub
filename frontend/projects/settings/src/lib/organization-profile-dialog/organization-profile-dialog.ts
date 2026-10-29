import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ORGANIZATION_SETTINGS_API, OrganizationDetails } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhDialog,
  PhErrorSummary,
  PhSelect,
  PhTextField,
} from '@promisehub/components';
import { TIME_ZONES } from '../time-zones';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  name: 'org-name',
  city: 'org-city',
  contactEmail: 'org-email',
  phone: 'org-phone',
  timeZone: 'org-tz',
};

/** Edit organization profile (dialog: organization-profile, L2-122). Closes with true once saved. */
@Component({
  selector: 'ph-organization-profile-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhErrorSummary, PhSelect, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organization-profile-dialog.html',
})
export class OrganizationProfileDialog {
  private readonly api = inject(ORGANIZATION_SETTINGS_API);
  private readonly current = inject<OrganizationDetails>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly zones = TIME_ZONES;
  protected name = this.current.name;
  protected city = this.current.city;
  protected contactEmail = this.current.contactEmail ?? '';
  protected phone = this.current.phone ?? '';
  protected timeZone = this.current.timeZone;
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
    this.api
      .saveProfile({
        name: this.name,
        city: this.city,
        contactEmail: this.contactEmail.trim() || null,
        phone: this.phone.trim() || null,
        timeZone: this.timeZone,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
