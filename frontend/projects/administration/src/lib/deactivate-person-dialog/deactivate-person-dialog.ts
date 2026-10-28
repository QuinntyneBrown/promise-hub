import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PEOPLE_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/**
 * Deactivate a person (dialog: deactivate-person): Cancel has focus; Deactivate signs them out everywhere and keeps every record
 * (L2-113 criterion 4). A youth hears that her child record and progress stay. Closes with true.
 */
@Component({
  selector: 'ph-deactivate-person-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deactivate-person-dialog.html',
})
export class DeactivatePersonDialog {
  private readonly api = inject(PEOPLE_API);
  protected readonly data = inject<{ id: string; name: string; youth: boolean }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly first = this.data.name.split(' ')[0];
  protected readonly description = computed(() =>
    this.data.youth
      ? 'They’re signed out everywhere and can’t sign in. Their child record, Learning progress and consents stay, and you can reactivate them while the child record exists.'
      : 'They’re signed out everywhere and can’t sign in. Their attendance, sessions and history stay, and you can reactivate them any time.',
  );
  protected readonly failed = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected confirm(): void {
    this.busy.set(true);
    this.failed.set(null);
    this.api.deactivate(this.data.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid')
        this.failed.set(Object.values(outcome.errors)[0] ?? 'Nothing changed.');
      else this.failed.set(`${this.first}’s account is still on. Try again.`);
    });
  }
}
