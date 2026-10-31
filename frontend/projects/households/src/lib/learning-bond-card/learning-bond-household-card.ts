import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { LEARNING_BOND_API, LearningBondHousehold } from '@promisehub/api';
import { PhButton, PhCard, PhDialogs, ToastService, formatDay } from '@promisehub/components';
import { LearningBondInviteDialog } from '../learning-bond-invite-dialog/learning-bond-invite-dialog';

/**
 * The Learning Bond card on a household (mock: household, state learning-bond-not-invited; L2-140 criteria 4 and 5): shown only while
 * Learning Bond is on, to staff whose role is in the status roles, for a covered household. It shows when the household was invited, or
 * Invite to Learning Bond; never a SIN, an answer or an amount. Anything else the API answers hides it.
 */
@Component({
  selector: 'ph-learning-bond-household-card',
  imports: [PhButton, PhCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-household-card.html',
})
export class LearningBondHouseholdCard {
  private readonly api = inject(LEARNING_BOND_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);

  readonly householdId = input.required<string>();

  protected readonly card = signal<LearningBondHousehold | null>(null);
  protected readonly programs = computed(() => this.card()?.programs.join(' and ') ?? '');

  constructor() {
    effect(() => this.load(this.householdId()));
  }

  protected invitedLine(at: string): string {
    return `Invited ${formatDay(at)}`;
  }

  /** Invite the {name} household to Learning Bond (learning-bond-invite-household). */
  protected invite(card: LearningBondHousehold): void {
    this.dialogs
      .open<string, LearningBondHousehold, LearningBondInviteDialog>(LearningBondInviteDialog, card)
      .closed.subscribe((invitedAt) => {
        if (!invitedAt) return;
        this.toasts.show({ tone: 'success', title: `${card.name} household invited` });
        this.card.set({ ...card, invitedAt });
      });
  }

  private load(householdId: string): void {
    this.api.household(householdId).subscribe((r) => {
      this.card.set(r.status === 'loaded' && r.value.covered ? r.value : null);
    });
  }
}
