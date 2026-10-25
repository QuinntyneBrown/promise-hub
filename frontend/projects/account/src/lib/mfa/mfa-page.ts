import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AUTH_API } from '@promisehub/api';
import {
  PhAlert,
  PhAuthCard,
  PhButton,
  PhSkipLink,
  PhSwitch,
  PhTextField,
} from '@promisehub/components';
import { safeReturnUrl } from '../safe-return-url';

/** The second sign-in step for admins and program directors (mock: sign-in/mfa). */
@Component({
  selector: 'ph-mfa-page',
  imports: [
    FormsModule,
    RouterLink,
    PhAlert,
    PhAuthCard,
    PhButton,
    PhSkipLink,
    PhSwitch,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mfa-page.html',
})
export class MfaPage {
  private readonly auth = inject(AUTH_API);
  private readonly router = inject(Router);

  readonly returnUrl = input<string | null>(null);

  protected code = '';
  protected trust = true;
  protected readonly submitting = signal(false);
  protected readonly invalid = signal(false);
  protected readonly failed = signal(false);

  protected submit(): void {
    this.submitting.set(true);
    this.invalid.set(false);
    this.failed.set(false);
    this.auth.completeMfa(this.code, this.trust).subscribe((outcome) => {
      this.submitting.set(false);
      if (outcome.status === 'signed-in') {
        void this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
      } else if (outcome.status === 'invalid') {
        this.code = '';
        this.invalid.set(true);
      } else {
        this.failed.set(true);
      }
    });
  }
}
