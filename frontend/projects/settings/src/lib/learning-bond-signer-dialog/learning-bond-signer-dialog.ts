import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEARNING_BOND_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhDialog,
  PhErrorSummary,
  PhTextField,
} from '@promisehub/components';

/** The server's field names, in the order the dialog shows them. */
const FIELDS = ['name', 'title', 'email'];

/**
 * Ask someone else to sign (dialog: learning-bond-signer, L2-137): the signer's name, role or title and email. Closes with the signer's
 * name once the link is sent; the page then waits for them. The data is the organization's name, which the email comes from.
 */
@Component({
  selector: 'ph-learning-bond-signer-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhErrorSummary, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-signer-dialog.html',
})
export class LearningBondSignerDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly organization = inject<string>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected name = '';
  protected title = '';
  protected email = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    FIELDS.filter((f) => this.errors()[f]).map((f) => ({
      field: `signer-${f}`,
      message: this.errors()[f]!,
    })),
  );
  protected readonly emailHelp = computed(() => `Sent from “${this.organization} via PromiseHub”.`);

  protected submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .requestSigner({ name: this.name, title: this.title, email: this.email })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(this.name.trim());
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
