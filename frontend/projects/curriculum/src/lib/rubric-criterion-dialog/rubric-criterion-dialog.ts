import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RubricCriterion } from '@promisehub/api';
import { PhButton, PhDialog, PhTextField } from '@promisehub/components';
import { RubricCriterionDialogData } from './rubric-criterion-dialog-data';

/**
 * Add or edit one rubric criterion (dialog: rubric-criterion, L2-074 criterion 4). Nothing is sent: it closes with the criterion and
 * the assignment builder keeps it until Save assignment, where the server checks the whole rubric again.
 */
@Component({
  selector: 'ph-rubric-criterion-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rubric-criterion-dialog.html',
})
export class RubricCriterionDialog {
  protected readonly data = inject<RubricCriterionDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<RubricCriterion>>(DialogRef);

  protected description = this.data.criterion?.description ?? '';
  protected points = this.data.criterion ? `${this.data.criterion.points}` : '';
  protected readonly errors = signal<Record<string, string>>({});

  protected submit(): void {
    const description = this.description.trim();
    const points = Number(`${this.points}`.trim());
    const errors: Record<string, string> = {};
    if (!description) errors['criterion'] = 'Describe the criterion.';
    else if (description.length > 200) errors['criterion'] = 'Keep it under 200 characters.';
    if (!Number.isInteger(points) || points < 1 || points > 100)
      errors['points'] = 'Give it 1 to 100 points.';
    this.errors.set(errors);
    if (Object.keys(errors).length === 0) this.ref.close({ description, points });
  }
}
