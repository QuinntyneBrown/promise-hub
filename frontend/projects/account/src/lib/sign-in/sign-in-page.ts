import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AUTH_API, SESSION_API, roleHome } from '@promisehub/api';
import {
  PhAlert,
  PhAuthCard,
  PhButton,
  PhSkipLink,
  PhSwitch,
  PhTextField,
} from '@promisehub/components';
import { safeReturnUrl } from '../safe-return-url';

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** "4:27 pm", as the mocks write times. */
const formatTime = (date: Date) =>
  timeFormat.format(date).replace(/\s?([AP])M$/, (_, p: string) => ` ${p.toLowerCase()}m`);

/** Sign in (mock: sign-in) in its default, invalid, submitting, error, expired and locked states. */
@Component({
  selector: 'ph-sign-in-page',
  imports: [FormsModule, PhAlert, PhAuthCard, PhButton, PhSkipLink, PhSwitch, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  private readonly auth = inject(AUTH_API);
  private readonly router = inject(Router);
  private readonly session = inject(SESSION_API);

  readonly returnUrl = input<string | null>(null);
  readonly reason = input<string | null>(null);

  protected email = '';
  protected password = '';
  protected remember = true;
  protected readonly submitting = signal(false);
  protected readonly invalid = signal(false);
  protected readonly failed = signal(false);
  protected readonly lockedUntil = signal<string | null>(null);
  protected readonly expired = computed(() => this.reason() === 'expired');
  protected readonly suspended = computed(() => this.reason() === 'suspended');

  protected lockedText(): string {
    const until = this.lockedUntil();
    const time = until ? formatTime(new Date(until)) : null;
    return `Sign-in paused${time ? ' until ' + time : ' for 15 minutes'}. You can reset your password instead.`;
  }

  /** A deep link wins; otherwise the home of the person's role (L2-046). */
  private goHome(): void {
    const target = safeReturnUrl(this.returnUrl());
    if (target !== '/') {
      void this.router.navigateByUrl(target);
      return;
    }
    this.session.current().subscribe({
      next: (session) => void this.router.navigateByUrl(roleHome(session)),
      error: () => void this.router.navigateByUrl('/'),
    });
  }

  protected submit(): void {
    this.submitting.set(true);
    this.invalid.set(false);
    this.failed.set(false);
    this.auth
      .signIn({ email: this.email, password: this.password, remember: this.remember })
      .subscribe((outcome) => {
        this.submitting.set(false);
        switch (outcome.status) {
          case 'signed-in':
            this.goHome();
            break;
          case 'mfa-required':
            void this.router.navigate(['/sign-in/mfa'], {
              queryParams: { returnUrl: this.returnUrl() },
            });
            break;
          case 'locked':
            this.lockedUntil.set(outcome.lockedUntil);
            break;
          case 'invalid':
            this.password = '';
            this.invalid.set(true);
            break;
          default:
            this.failed.set(true);
        }
      });
  }
}
