import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MENTORING_API, QuizApprovalItem } from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhButton,
  PhDescriptionList,
  PhDialog,
  PhTextField,
} from '@promisehub/components';

/**
 * Approves one quiz result (dialog: approve-quiz, L2-081 criterion 2): the auto-score against the pass mark, and an optional override from 0
 * to 100 checked here and on the server. Closes true once approved; stays open with the failure when the call fails.
 */
@Component({
  selector: 'ph-approve-quiz-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDescriptionList, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approve-quiz-dialog.html',
})
export class ApproveQuizDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly item = inject<QuizApprovalItem>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly override = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected readonly facts: Fact[] = [
    { key: 'youth', term: 'Youth', value: this.item.youthName },
    { key: 'quiz', term: 'Quiz', value: `${this.item.quizTitle} · attempt ${this.item.number}` },
    {
      key: 'score',
      term: 'Auto-score',
      value: `${this.item.score}% · ${this.item.correct} of ${this.item.total} right`,
    },
    { key: 'pass', term: 'Pass mark', value: `${this.item.passMark}%` },
  ];

  protected approve(): void {
    const raw = String(this.override() ?? '').trim();
    const value = raw === '' ? null : Number(raw);
    if (value !== null && (!/^\d+$/.test(raw) || value > 100)) {
      this.error.set('Enter a whole number from 0 to 100, or leave it blank.');
      return;
    }
    this.error.set(null);
    this.busy.set(true);
    this.failed.set(false);
    this.api.approveQuiz(this.item.id, value).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.error.set(outcome.errors['override'] ?? null);
      else this.failed.set(true);
    });
  }
}
