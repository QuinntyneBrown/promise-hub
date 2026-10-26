import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { INVITATION_API } from '@promisehub/api';
import {
  PhAlert,
  PhAuthCard,
  PhButton,
  PhSkipLink,
  PhStepper,
  PhTextField,
} from '@promisehub/components';

/** Onboarding, phone (mock: onboard-staff-phone): a mobile with an area code, for alerts only, never shown to guardians (L2-009 criterion 3). */
@Component({
  selector: 'ph-onboard-phone-page',
  imports: [FormsModule, PhAlert, PhAuthCard, PhButton, PhSkipLink, PhStepper, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboard-phone-page.html',
})
export class OnboardPhonePage {
  private readonly api = inject(INVITATION_API);
  private readonly router = inject(Router);

  protected mobile = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected save(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.savePhone(this.mobile).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') void this.router.navigateByUrl('/welcome/ready');
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
