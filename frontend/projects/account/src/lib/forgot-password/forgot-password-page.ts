import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AUTH_API } from '@promisehub/api';
import { PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField } from '@promisehub/components';

/** Forgot password (mock: forgot-password): asks for a reset link; the answer is the same whether or not the address exists. */
@Component({
  selector: 'ph-forgot-password-page',
  imports: [FormsModule, PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password-page.html',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AUTH_API);

  protected email = '';
  protected readonly sentTo = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    const email = this.email.trim();
    this.error.set(null);
    this.failed.set(false);
    if (!email.includes('@')) {
      this.error.set('Enter your work email.');
      return;
    }
    this.busy.set(true);
    this.auth.forgotPassword(email).subscribe((r) => {
      this.busy.set(false);
      if (r === 'sent') this.sentTo.set(email);
      else this.failed.set(true);
    });
  }
}
