import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PROGRAMS_API, Program } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, ToastService } from '@promisehub/components';

/** Open enrollment (dialog: open-enrollment): opens it, then shows the one link to share. Closes with true when opened. */
@Component({
  selector: 'ph-open-enrollment-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './open-enrollment-dialog.html',
  styleUrl: './open-enrollment-dialog.scss',
})
export class OpenEnrollmentDialog {
  private readonly api = inject(PROGRAMS_API);
  private readonly toasts = inject(ToastService);
  protected readonly program = inject<Program>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly url = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected open(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.openEnrollment(this.program.id).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'loaded') this.url.set(r.value.url);
      else this.failed.set(true);
    });
  }

  protected copy(url: string): void {
    void navigator.clipboard?.writeText(url).then(
      () => this.toasts.show({ tone: 'success', title: 'Link copied' }),
      () => undefined,
    );
  }
}
