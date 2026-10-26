import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PLATFORM_API, PlatformOrganization } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup, RadioOption } from '@promisehub/components';

/** Suspend organization (mock: suspend-organization): access and messaging stop until reinstated; nothing is deleted. */
@Component({
  selector: 'ph-suspend-organization-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './suspend-organization-dialog.html',
})
export class SuspendOrganizationDialog {
  private readonly api = inject(PLATFORM_API);
  protected readonly data = inject<PlatformOrganization>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly reasons: RadioOption[] = [
    { value: 'Unpaid invoice', label: 'Unpaid invoice' },
    { value: 'Requested by the organization', label: 'Requested by the organization' },
    { value: 'Safeguarding review', label: 'Safeguarding review' },
  ];
  protected reason = 'Unpaid invoice';
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected save(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.suspend(this.data.id, this.reason).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
