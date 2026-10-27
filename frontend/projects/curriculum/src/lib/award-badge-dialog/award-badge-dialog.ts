import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhSelect, SelectOption } from '@promisehub/components';
import { AwardBadgeDialogData } from './award-badge-dialog-data';

/** Award a badge by hand (dialog: award-badge, L2-085 criteria 4 and 5); closes with the youth's name. */
@Component({
  selector: 'ph-award-badge-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './award-badge-dialog.html',
})
export class AwardBadgeDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<AwardBadgeDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected membershipId = '';
  protected readonly options: SelectOption[] = [
    { value: '', label: 'Choose a youth' },
    ...this.data.youth.map((y) => ({ value: y.membershipId, label: y.name })),
  ];
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    const name = this.data.youth.find((y) => y.membershipId === this.membershipId)?.name ?? '';
    this.api.awardBadge(this.data.id, this.membershipId || null).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(name);
      } else if (outcome.status === 'invalid') {
        this.error.set(outcome.errors['membershipId'] ?? 'Choose a youth of your organization.');
      } else if (outcome.status === 'already-awarded') {
        this.error.set(`${name} already has this badge.`);
      } else {
        this.failed.set(true);
      }
    });
  }
}
