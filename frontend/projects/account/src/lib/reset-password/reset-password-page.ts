import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AUTH_API, ResetCheck, SESSION_API, roleHome } from '@promisehub/api';
import { PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField } from '@promisehub/components';

/** Reset password (mock: reset-password): from the emailed link, choose a new password and carry on signed in. */
@Component({
  selector: 'ph-reset-password-page',
  imports: [FormsModule, PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password-page.html',
})
export class ResetPasswordPage {
  private readonly auth = inject(AUTH_API);
  private readonly router = inject(Router);
  private readonly session = inject(SESSION_API);

  /** The token from the emailed link's query string. */
  readonly token = input<string>('');

  protected readonly check = signal<ResetCheck | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected password = '';
  protected repeat = '';

  constructor() {
    effect(() => {
      const token = this.token();
      if (token) this.auth.checkReset(token).subscribe((c) => this.check.set(c));
      else this.check.set({ status: 'gone' });
    });
  }

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.auth.resetPassword(this.token(), this.password, this.repeat).subscribe((r) => {
      this.busy.set(false);
      switch (r.status) {
        case 'signed-in':
          // The home of the person's role, as after signing in (L2-046).
          this.session.current().subscribe({
            next: (session) => void this.router.navigateByUrl(roleHome(session)),
            error: () => void this.router.navigateByUrl('/'),
          });
          break;
        case 'mfa-required':
          void this.router.navigate(['/sign-in/mfa']);
          break;
        case 'invalid':
          this.errors.set(r.errors);
          break;
        case 'gone':
          this.check.set({ status: 'gone' });
          break;
        default:
          this.failed.set(true);
      }
    });
  }
}
