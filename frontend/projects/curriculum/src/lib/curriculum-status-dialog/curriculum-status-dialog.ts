import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API, ContentStatus, WriteOutcome } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDescriptionList,
  PhDialog,
  PhRadioGroup,
  RadioOption,
  ToastService,
} from '@promisehub/components';
import { Observable } from 'rxjs';
import { statusLabel } from '../status-label';
import { CurriculumStatusDialogData } from './curriculum-status-dialog-data';

/** Change the status of a track, module, lesson or quiz (dialog: curriculum-status, L2-066 criterion 6, L2-067 criterion 4, L2-073 criterion 6). */
@Component({
  selector: 'ph-curriculum-status-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDescriptionList, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './curriculum-status-dialog.html',
})
export class CurriculumStatusDialog {
  private readonly api = inject(CURRICULUM_API);
  private readonly toasts = inject(ToastService);
  protected readonly data = inject<CurriculumStatusDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected status: ContentStatus = this.data.status;
  protected readonly options: RadioOption[] = [
    { value: 'Draft', label: 'Draft', hint: 'Only authors see it' },
    ...(this.data.kind === 'module'
      ? [{ value: 'InReview', label: 'In review', hint: 'Ready for another author to check' }]
      : []),
    {
      value: 'Published',
      label: 'Published',
      hint:
        this.data.kind === 'track'
          ? 'Published modules reach the cohorts that follow it'
          : 'Youth in the cohorts that follow the track see it',
    },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.call().subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: 'Status saved',
          text: `${this.data.name} is ${statusLabel(this.status).toLowerCase()}.`,
        });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  private call(): Observable<WriteOutcome> {
    const { kind, id } = this.data;
    switch (kind) {
      case 'track':
        return this.api.setTrackStatus(id, this.status);
      case 'module':
        return this.api.setModuleStatus(id, this.status);
      case 'quiz':
        return this.api.setQuizStatus(id, this.status);
      default:
        return this.api.setLessonStatus(id, this.status);
    }
  }
}
