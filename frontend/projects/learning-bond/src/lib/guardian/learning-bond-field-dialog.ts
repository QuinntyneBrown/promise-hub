import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  BenefitReview,
  BenefitReviewChange,
  LEARNING_BOND_API,
  LearningBondApplication,
  LearningBondApplicationChange,
} from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField } from '@promisehub/components';
import { GuardianLearningBondText } from './guardian-learning-bond-text';

/** The data the Edit dialog needs: the application, the field, its label and value, and the page's words. */
export interface LearningBondFieldData {
  token: string;
  applicationId: string;
  field: 'address' | 'phone' | 'email';
  /** A benefit's application rather than the Learning Bond one (L2-156). */
  benefit?: boolean;
  label: string;
  value: string;
  text: GuardianLearningBondText;
}

/** Edit one field for this application only (learning-bond-review/edit, L2-148 criterion 4). Closes with the review as it now stands. */
@Component({
  selector: 'ph-learning-bond-field-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-field-dialog.html',
})
export class LearningBondFieldDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly data = inject<LearningBondFieldData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<LearningBondApplication | BenefitReview>>(DialogRef);

  protected value = this.data.value;
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected inputType(): 'tel' | 'email' | 'text' {
    return this.data.field === 'phone' ? 'tel' : this.data.field === 'email' ? 'email' : 'text';
  }

  protected save(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    const call: Observable<LearningBondApplicationChange | BenefitReviewChange> = this.data.benefit
      ? this.api.editBenefitField(
          this.data.token,
          this.data.applicationId,
          this.data.field,
          this.value,
        )
      : this.api.editApplicationField(
          this.data.token,
          this.data.applicationId,
          this.data.field,
          this.value,
        );
    call.subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved') this.ref.close(r.value);
      else if (r.status === 'invalid') this.error.set(r.errors['value'] ?? null);
      else this.failed.set(true);
    });
  }
}
