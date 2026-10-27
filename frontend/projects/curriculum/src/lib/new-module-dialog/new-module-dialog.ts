import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField, PhTextarea } from '@promisehub/components';
import { NewModuleDialogData } from './new-module-dialog-data';

/** Add a module at the end of a track (dialog: new-module, L2-066 criterion 3); closes with the new module's id. */
@Component({
  selector: 'ph-new-module-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-module-dialog.html',
})
export class NewModuleDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<NewModuleDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected title = '';
  protected description = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.createModule(this.data.trackId, this.title, this.description).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(outcome.id);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
