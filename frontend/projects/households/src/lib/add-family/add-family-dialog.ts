import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOUSEHOLDS_API, NewFamily } from '@promisehub/api';
import { PhButton, PhDialog, PhSelect, PhTextField, ToastService } from '@promisehub/components';
import { LANGUAGES } from '../relationships';

/** Add a family (dialog: add-family): the first guardian and how to reach them. Closes with the new household id. */
@Component({
  selector: 'ph-add-family-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhSelect, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-family-dialog.html',
})
export class AddFamilyDialog {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly toasts = inject(ToastService);
  protected readonly ref = inject<DialogRef<string | undefined>>(DialogRef);

  protected readonly languages = LANGUAGES;
  protected family: NewFamily = { guardianName: '', mobile: '', email: '', language: 'English' };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api.create(this.family).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: 'Family added',
          text: this.family.guardianName,
        });
        this.ref.close(outcome.id);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.errors.set({ guardianName: 'We couldn’t add the family. Try again.' });
      }
    });
  }
}
