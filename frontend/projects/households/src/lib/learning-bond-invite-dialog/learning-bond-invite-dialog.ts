import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LEARNING_BOND_API, LearningBondHousehold } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhSmsPreview } from '@promisehub/components';

/**
 * Invite the {name} household to Learning Bond (dialog: learning-bond-invite-household, L2-140 criteria 4 and 5): the text it gets, to whom
 * and in which language, sent at once. Closes with when the household was invited, now or within the last 7 days.
 */
@Component({
  selector: 'ph-learning-bond-invite-dialog',
  imports: [PhAlert, PhButton, PhDialog, PhSmsPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-invite-dialog.html',
})
export class LearningBondInviteDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly card = inject<LearningBondHousehold>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  /** "One text to Dana Thompson now, in English, naming Jordan." */
  protected description(): string {
    const c = this.card;
    const to =
      c.recipients.length === 1
        ? `One text to ${c.recipients[0]}`
        : `A text to ${list(c.recipients)}`;
    return `${to} now, in ${c.language}, naming ${list(c.children)}.`;
  }

  protected send(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.inviteHousehold(this.card.householdId).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'invited' || outcome.status === 'already')
        this.ref.close(outcome.invitedAt);
      else this.failed.set(true);
    });
  }
}

function list(names: string[]): string {
  return names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}
