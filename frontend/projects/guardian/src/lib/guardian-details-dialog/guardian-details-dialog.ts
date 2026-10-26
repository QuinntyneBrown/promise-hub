import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GUARDIAN_API } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhSelect,
  PhTextField,
  PhTextarea,
  SelectOption,
} from '@promisehub/components';
import { HomeText } from '../home-text';

export interface GuardianDetailsData {
  token: string;
  text: HomeText;
  /** Contact details, or one child's medical details. */
  contact: { mobile: string | null; email: string | null; language: string } | null;
  child: {
    id: string;
    firstName: string;
    allergies: string | null;
    medication: string | null;
  } | null;
}

/** The family page's corrections (page: guardian-update): the guardian's contact and language, or a child's health. Closes with true. */
@Component({
  selector: 'ph-guardian-details-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-details-dialog.html',
})
export class GuardianDetailsDialog {
  private readonly api = inject(GUARDIAN_API);
  protected readonly data = inject<GuardianDetailsData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected mobile = this.data.contact?.mobile ?? '';
  protected email = this.data.contact?.email ?? '';
  protected language = this.data.contact?.language ?? 'English';
  protected allergies = this.data.child?.allergies ?? '';
  protected medication = this.data.child?.medication ?? '';
  protected readonly languages: SelectOption[] = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected save(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    const child = this.data.child;
    const call = child
      ? this.api.updateMedical(this.data.token, child.id, {
          allergies: this.allergies,
          medication: this.medication,
        })
      : this.api.updateHousehold(this.data.token, {
          mobile: this.mobile,
          email: this.email,
          language: this.language,
        });
    call.subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
