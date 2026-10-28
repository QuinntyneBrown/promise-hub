import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AUTH_API } from '@promisehub/api';
import {
  PhAlert,
  PhAuthCard,
  PhButton,
  PhSkipLink,
  PhTextField,
  ToastService,
} from '@promisehub/components';
import { maskEmail } from './mask-email';

/**
 * Forgot password (mock: forgot-password): anyone with an account asks for a reset link; the answer is the same whether or
 * not the address exists, the address is masked, and the email can be sent again (L2-044, L2-115).
 */
@Component({
  selector: 'ph-forgot-password-page',
  imports: [FormsModule, PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password-page.html',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AUTH_API);
  private readonly toasts = inject(ToastService);

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
      this.error.set('Enter your email address.');
      return;
    }
    this.send(email, false);
  }

  protected resend(): void {
    const email = this.sentTo();
    if (email) this.send(email, true);
  }

  private send(email: string, again: boolean): void {
    this.busy.set(true);
    this.auth.forgotPassword(email).subscribe((r) => {
      this.busy.set(false);
      if (r !== 'sent') {
        if (again)
          this.toasts.show({
            tone: 'danger',
            title: 'We couldn’t send the email',
            text: 'Try again in a moment.',
          });
        else this.failed.set(true);
        return;
      }
      const masked = maskEmail(email);
      this.sentTo.set(email);
      if (again)
        this.toasts.show({
          tone: 'success',
          title: 'Sent again',
          text: `If ${masked} has an account, the newest link is the one that works.`,
        });
    });
  }

  protected masked(email: string): string {
    return maskEmail(email);
  }
}
