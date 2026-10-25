import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ATTENDANCE_API, PickupOptions, RosterEntry } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhSwitch,
  PhTextField,
  RadioOption,
} from '@promisehub/components';

export interface SignOutData {
  sessionId: string;
  entry: RosterEntry;
}

/** Who collected the child, for the toast and the row. Undefined when cancelled. */
export type SignOutResult = { collectedBy: string } | undefined;

const SOMEONE_ELSE = 'someone-else';

/**
 * Sign a child out (dialog: confirm-pickup): pick from the approved list, or name someone else with the primary
 * guardian's okay by phone (L2-017 criterion 3, L2-020 criterion 3).
 */
@Component({
  selector: 'ph-sign-out-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup, PhSwitch, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-out-dialog.html',
})
export class SignOutDialog {
  private readonly api = inject(ATTENDANCE_API);
  protected readonly data = inject<SignOutData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<SignOutResult>>(DialogRef);

  protected readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly pickups = signal<PickupOptions | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly who = signal('');
  protected otherName = '';
  protected guardianConfirmed = false;
  protected idChecked = true;

  protected readonly first = this.data.entry.name.split(' ')[0];
  protected readonly someoneElse = computed(() => this.who() === SOMEONE_ELSE);
  protected readonly options = computed<RadioOption[]>(() => {
    const p = this.pickups();
    if (!p) return [];
    return [
      ...p.approved.map((a) => ({
        value: a.guardianId,
        label: a.name,
        hint: `${a.relationship}${a.isPrimary ? ' · primary' : ' · ask for ID'}`,
      })),
      {
        value: SOMEONE_ELSE,
        label: 'Someone else',
        hint: `Needs ${p.primaryName ?? 'the guardian'}’s okay by phone`,
      },
    ];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.pickups(this.data.entry.childId!).subscribe((result) => {
      if (result.status === 'loaded') {
        this.pickups.set(result.value);
        this.state.set('loaded');
      } else {
        this.state.set('error');
      }
    });
  }

  protected submit(): void {
    if (this.busy() || this.state() !== 'loaded') return;
    const chosen = this.who();
    const someoneElse = chosen === SOMEONE_ELSE;
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .signOut(this.data.sessionId, {
        childId: this.data.entry.childId!,
        guardianId: chosen && !someoneElse ? chosen : null,
        someoneElse,
        otherName: someoneElse ? this.otherName : null,
        guardianConfirmed: someoneElse && this.guardianConfirmed,
        idChecked: this.idChecked,
        leftAt: null,
        clientActionId: crypto.randomUUID(),
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          const adult = this.pickups()?.approved.find((a) => a.guardianId === chosen);
          this.ref.close({
            collectedBy: someoneElse ? this.otherName.trim() : (adult?.name ?? ''),
          });
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
