import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PROGRAMS_API, Program } from '@promisehub/api';
import { PhButton, PhDialog, PhTextField, ToastService } from '@promisehub/components';

/** Archive a program (dialog: archive-program) once its name is typed. */
@Component({
  selector: 'ph-archive-program-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './archive-program-dialog.html',
})
export class ArchiveProgramDialog {
  private readonly api = inject(PROGRAMS_API);
  private readonly toasts = inject(ToastService);
  protected readonly program = inject<Program>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly confirmName = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected matches(): boolean {
    return this.confirmName().trim().toLowerCase() === this.program.name.toLowerCase();
  }

  protected submit(): void {
    if (!this.matches()) {
      return;
    }
    this.busy.set(true);
    this.api.archive(this.program.id, this.confirmName()).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: `${this.program.name} archived`,
          text: 'Restore it any time.',
        });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.error.set(outcome.errors['confirmName'] ?? 'Type the program name to confirm.');
      } else {
        this.error.set('We couldn’t archive the program. Try again.');
      }
    });
  }
}
