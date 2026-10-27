import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API, CurriculumProgram } from '@promisehub/api';
import {
  CheckboxOption,
  PhAlert,
  PhButton,
  PhCheckboxGroup,
  PhDialog,
  ToastService,
} from '@promisehub/components';
import { TrackCohortsDialogData } from './track-cohorts-dialog-data';

/** Choose the cohorts (programs) that follow a track (dialog: track-cohorts, L2-066 criterion 7); a program follows one track. */
@Component({
  selector: 'ph-track-cohorts-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhCheckboxGroup, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './track-cohorts-dialog.html',
})
export class TrackCohortsDialog {
  private readonly api = inject(CURRICULUM_API);
  private readonly toasts = inject(ToastService);
  protected readonly data = inject<TrackCohortsDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly options: CheckboxOption[] = this.data.curriculum.programs.map((p) => ({
    value: p.id,
    label: p.name,
    hint: this.hint(p),
  }));
  protected chosen = this.data.track.followedBy.map((p) => p.id);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.setTrackCohorts(this.data.track.id, this.chosen).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: 'Cohorts saved', text: this.data.track.name });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  private hint(p: CurriculumProgram): string {
    const follows =
      p.trackId === null
        ? 'No track'
        : p.trackId === this.data.track.id
          ? null
          : `Follows ${this.data.curriculum.tracks.find((t) => t.id === p.trackId)?.name ?? 'another track'}`;
    return [p.term, p.schedule, follows].filter(Boolean).join(' · ');
  }
}
