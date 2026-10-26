import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { INVITATION_API, InvitationResult, ROLE_LABELS } from '@promisehub/api';
import { PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField } from '@promisehub/components';

/** Accept a staff invitation (mock: accept-invite): the invited email read-only, a name and a password (L2-009 criteria 1 and 2). */
@Component({
  selector: 'ph-accept-invite-page',
  imports: [FormsModule, PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accept-invite-page.html',
})
export class AcceptInvitePage {
  private readonly api = inject(INVITATION_API);
  private readonly router = inject(Router);

  readonly token = input.required<string>();

  protected readonly result = signal<InvitationResult | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly roleLabels = ROLE_LABELS;
  protected name = '';
  protected password = '';

  constructor() {
    effect(() => this.api.get(this.token()).subscribe((r) => this.result.set(r)));
  }

  protected accept(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.accept(this.token(), this.name, this.password).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') void this.router.navigateByUrl('/welcome/phone');
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
