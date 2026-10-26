import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewOrganization, PLATFORM_API } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhSelect,
  PhTextField,
  SelectOption,
} from '@promisehub/components';

/** Add organization (mock: add-organization): a new tenant whose first admin finishes setup from the welcome email. */
@Component({
  selector: 'ph-add-organization-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-organization-dialog.html',
})
export class AddOrganizationDialog {
  private readonly api = inject(PLATFORM_API);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly plans: SelectOption[] = [
    { value: 'Free', label: 'Free (up to 50 children)' },
    { value: 'Standard', label: 'Standard ($89/month)' },
  ];
  protected readonly presets: SelectOption[] = [
    { value: 'Whole suite', label: 'Whole suite' },
    { value: 'Just check-in', label: 'Just check-in' },
    { value: 'Just slips', label: 'Just slips' },
  ];
  protected name = '';
  protected adminEmail = '';
  protected plan: NewOrganization['plan'] = 'Free';
  protected preset: NewOrganization['preset'] = 'Whole suite';
  protected readonly busy = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly created = signal<{ name: string; email: string } | null>(null);

  protected save(): void {
    this.busy.set(true);
    this.errors.set({});
    this.failed.set(false);
    const organization = {
      name: this.name,
      adminEmail: this.adminEmail,
      plan: this.plan,
      preset: this.preset,
    };
    this.api.add(organization).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved')
        this.created.set({ name: organization.name.trim(), email: organization.adminEmail.trim() });
      else if (r.status === 'invalid') this.errors.set(r.errors);
      else this.failed.set(true);
    });
  }
}
