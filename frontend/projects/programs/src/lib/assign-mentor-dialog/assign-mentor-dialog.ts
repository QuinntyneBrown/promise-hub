import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MENTORING_API, WriteOutcome } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhSelect,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { Observable } from 'rxjs';
import { AssignMentorDialogData } from './assign-mentor-dialog-data';

/** Assign a mentor to a youth on a cohort's roster (dialog: assign-mentor); one mentor per youth (L2-062). */
@Component({
  selector: 'ph-assign-mentor-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assign-mentor-dialog.html',
})
export class AssignMentorDialog {
  private readonly api = inject(MENTORING_API);
  private readonly toasts = inject(ToastService);
  protected readonly data = inject<AssignMentorDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly options: SelectOption[] = [
    { value: '', label: 'Choose a mentor' },
    ...this.data.mentors.map((m) => ({ value: m.id, label: m.name })),
  ];
  protected mentorId = this.data.youth.mentor?.id ?? '';
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal<'assign' | 'remove' | null>(null);

  protected submit(): void {
    this.save(
      'assign',
      this.api.assignYouth(this.data.program.id, this.data.youth.childId, this.mentorId || null),
    );
  }

  protected remove(): void {
    this.save('remove', this.api.unassignYouth(this.data.program.id, this.data.youth.childId));
  }

  private save(action: 'assign' | 'remove', request: Observable<WriteOutcome>): void {
    this.busy.set(action);
    this.failed.set(false);
    request.subscribe((outcome) => {
      this.busy.set(null);
      if (outcome.status === 'saved') {
        const mentor = this.data.mentors.find((m) => m.id === this.mentorId)?.name;
        this.toasts.show(
          action === 'assign'
            ? {
                tone: 'success',
                title: 'Mentor assigned',
                text: `${mentor} now mentors ${this.data.youth.name}.`,
              }
            : {
                tone: 'info',
                title: 'Mentor removed',
                text: `${this.data.youth.name} has no mentor.`,
              },
        );
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.error.set(outcome.errors['mentorId'] ?? 'Choose a mentor.');
      } else {
        this.failed.set(true);
      }
    });
  }
}
