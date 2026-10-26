import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  INVITATION_API,
  Invitation,
  InvitationResult,
  PARTICIPANT_ROLES,
  ROLE_LABELS,
  SESSION_API,
  roleHome,
} from '@promisehub/api';
import { PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField } from '@promisehub/components';

/**
 * Accept an invitation (mock: accept-invite): the invited email read-only, a name and a password (L2-009, L2-052). Staff
 * continue to the phone step; youth, mentors and volunteers go to the home of their role (ADR 0044, ADR 0045).
 */
@Component({
  selector: 'ph-accept-invite-page',
  imports: [FormsModule, PhAlert, PhAuthCard, PhButton, PhSkipLink, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accept-invite-page.html',
})
export class AcceptInvitePage {
  private readonly api = inject(INVITATION_API);
  private readonly router = inject(Router);
  private readonly session = inject(SESSION_API);

  readonly token = input.required<string>();

  protected readonly result = signal<InvitationResult | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly roleLabels = ROLE_LABELS;
  protected name = '';
  protected password = '';

  constructor() {
    effect(() =>
      this.api.get(this.token()).subscribe((r) => {
        if (r.status === 'open' && r.invitation.suggestedName && !this.name) {
          this.name = r.invitation.suggestedName;
        }
        this.result.set(r);
      }),
    );
  }

  protected subtitle(i: Invitation): string {
    return i.role === 'Youth'
      ? `${i.invitedBy} invited you to Learning as a Youth.`
      : `${i.invitedBy} invited you as ${this.roleLabels[i.role]}.`;
  }

  protected joinLabel(i: Invitation): string {
    return i.role === 'Youth' ? 'Join and start Learning' : 'Accept and continue';
  }

  protected accept(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.accept(this.token(), this.name, this.password).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.joined();
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }

  /** Staff continue to the phone step; a participant role lands on its home (L2-052 criterion 2). */
  private joined(): void {
    const r = this.result();
    if (r?.status !== 'open' || !PARTICIPANT_ROLES.includes(r.invitation.role)) {
      void this.router.navigateByUrl('/welcome/phone');
      return;
    }
    this.session.current().subscribe({
      next: (session) => void this.router.navigateByUrl(roleHome(session)),
      error: () => void this.router.navigateByUrl('/'),
    });
  }
}
