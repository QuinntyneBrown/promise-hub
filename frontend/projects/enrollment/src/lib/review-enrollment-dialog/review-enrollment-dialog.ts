import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ENROLLMENT_API, EnrollmentRequest, ReviewDecision } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextarea,
  RadioOption,
} from '@promisehub/components';

export interface ReviewEnrollmentData {
  request: EnrollmentRequest;
  decision: ReviewDecision;
  program: string;
  places: string;
  /** The decisions offered; all three by default. An application page offers only Waitlist and Decline (decide-application). */
  decisions?: ReviewDecision[];
}

/** Review one enrollment (dialogs: review-enrollment, decide-application): accept, waitlist or decline, with a note the guardian reads. Closes with the decision made. */
@Component({
  selector: 'ph-review-enrollment-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-enrollment-dialog.html',
})
export class ReviewEnrollmentDialog {
  private readonly api = inject(ENROLLMENT_API);
  protected readonly data = inject<ReviewEnrollmentData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<ReviewDecision>>(DialogRef);

  protected readonly decision = signal<ReviewDecision>(this.data.decision);
  protected note = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly options: RadioOption[] = [
    { value: 'Accept', label: 'Accept', hint: 'On the roster now' },
    { value: 'Waitlist', label: 'Waitlist', hint: 'Next place on the waitlist' },
    { value: 'Decline', label: 'Decline', hint: 'Say why below' },
  ].filter((o) => !this.data.decisions || this.data.decisions.includes(o.value as ReviewDecision));
  protected readonly first = this.data.request.guardian.split(' ')[0] ?? '';
  protected readonly primary = computed(() => `${this.decision()} and text ${this.first}`);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .review(this.data.request.id, this.decision(), this.note.trim() || null)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(this.decision());
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
