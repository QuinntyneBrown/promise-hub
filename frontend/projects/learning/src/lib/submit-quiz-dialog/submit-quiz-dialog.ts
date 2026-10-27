import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LEARNING_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { SubmitQuizDialogData } from './submit-quiz-dialog-data';

/**
 * Confirms submitting a quiz attempt (dialog: submit-quiz, L2-075 criterion 5): warns that it is scored and locked, names blank
 * questions, and submits; closes with true once submitted, or 'submitted' when another tab already did.
 */
@Component({
  selector: 'ph-submit-quiz-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submit-quiz-dialog.html',
})
export class SubmitQuizDialog {
  private readonly api = inject(LEARNING_API);
  protected readonly data = inject<SubmitQuizDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean | 'submitted'>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected description(): string {
    const d = this.data;
    return d.attemptsAllowed === null
      ? `${d.title} · Attempt ${d.number}`
      : `${d.title} · Attempt ${d.number} of ${d.attemptsAllowed}`;
  }

  /** “Questions 2 and 3 are blank”, “Question 4 is blank”. */
  protected blankText(): string {
    const b = this.data.blank;
    const list = b.length === 1 ? `${b[0]}` : `${b.slice(0, -1).join(', ')} and ${b[b.length - 1]}`;
    return `${b.length === 1 ? 'Question' : 'Questions'} ${list} ${b.length === 1 ? 'is' : 'are'} blank and will count as wrong. Once you submit, this attempt is scored and locked.`;
  }

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .submitQuiz(this.data.attemptId, this.data.answers, this.data.position)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else if (outcome.status === 'submitted') this.ref.close('submitted');
        else this.failed.set(true);
      });
  }
}
