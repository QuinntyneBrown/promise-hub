import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GUARDIAN_API } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextField,
  RadioOption,
} from '@promisehub/components';
import { DataRequestText } from '../data-request-text';

export interface GuardianDataRequestData {
  token: string;
  text: DataRequestText;
  email: string | null;
}

/** Ask about your family's data (dialog: guardian-data-request): a copy or deletion, sent to an email. Closes with true. */
@Component({
  selector: 'ph-guardian-data-request-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-data-request-dialog.html',
})
export class GuardianDataRequestDialog {
  private readonly api = inject(GUARDIAN_API);
  protected readonly data = inject<GuardianDataRequestData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected kind = 'Export';
  protected email = this.data.email ?? '';
  protected readonly options: RadioOption[] = [
    { value: 'Export', label: this.data.text.copy },
    { value: 'Delete', label: this.data.text.delete },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected send(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .requestData(this.data.token, this.kind as 'Export' | 'Delete', this.email)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
