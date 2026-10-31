import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, map } from 'rxjs';
import {
  LEARNING_BOND_API,
  SESSION_API,
  LEARNING_BOND_FAMILY_STATUS_LABELS,
  LearningBondFamilies,
  LearningBondFamily,
  LearningBondFamilyStatus,
} from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  SelectOption,
  ToastService,
  formatDay,
} from '@promisehub/components';
import { LearningBondCallOutcomeDialog } from './learning-bond-call-outcome-dialog';

const TONES: Partial<Record<LearningBondFamilyStatus, 'neutral' | 'info' | 'success' | 'warning'>> =
  {
    Invited: 'info',
    Started: 'info',
    Submitted: 'success',
    Deposited: 'success',
    CallRequested: 'warning',
    PausedNeedsSin: 'warning',
    PausedNeedsTaxReturn: 'warning',
    PausedNeedsDocument: 'warning',
  };

/**
 * Learning Bond households (mock: learning-bond-families, L2-142): each covered household with its status and last change, filtered by
 * status and program, for staff whose role is in the status roles. Nothing else about the claim appears.
 */
@Component({
  selector: 'ph-learning-bond-families-page',
  imports: [
    FormsModule,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-families-page.html',
  styleUrl: './learning-bond-families-page.css',
})
export class LearningBondFamiliesPage {
  private readonly api = inject(LEARNING_BOND_API);
  /** Roles that read reports also see the dashboard (L2-141). */
  protected readonly readsReports = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(
        map((session) => ['Admin', 'ProgramDirector', 'SiteLead'].includes(session.role)),
        catchError(() => EMPTY),
      ),
    { initialValue: false },
  );
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);

  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly list = signal<LearningBondFamilies | null>(null);
  protected readonly status = signal('');
  protected readonly program = signal('');
  protected readonly statuses: SelectOption[] = [
    { value: '', label: 'All' },
    ...Object.entries(LEARNING_BOND_FAMILY_STATUS_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];
  protected readonly programs = computed<SelectOption[]>(() => [
    { value: '', label: 'All programs' },
    ...(this.list()?.programs ?? []).map((p) => ({ value: p.id, label: p.name })),
  ]);
  protected readonly subtitle = computed(() => {
    const l = this.list();
    return l ? `${l.covered} covered` : '';
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    if (!this.list()) this.state.set('loading');
    this.api.families(this.status() || null, this.program() || null).subscribe((r) => {
      if (r.status === 'loaded') {
        this.list.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected filter(change: { status?: string; program?: string }): void {
    if (change.status !== undefined) this.status.set(change.status);
    if (change.program !== undefined) this.program.set(change.program);
    this.load();
  }

  protected label(f: LearningBondFamily): string {
    return LEARNING_BOND_FAMILY_STATUS_LABELS[f.status];
  }

  protected tone(f: LearningBondFamily): 'neutral' | 'info' | 'success' | 'warning' {
    return TONES[f.status] ?? 'neutral';
  }

  protected meta(f: LearningBondFamily): string {
    const parts = [f.guardian, f.programs].filter((p) => !!p);
    if (f.changedAt) parts.push(formatDay(f.changedAt));
    return parts.join(' · ');
  }

  /** "289-555-0119 · afternoons", while a call is requested. */
  protected call(f: LearningBondFamily): string | null {
    return f.callPhone ? `${f.callPhone} · ${(f.callWhen ?? '').toLowerCase()}` : null;
  }

  /** Mark call done (learning-bond-call-outcome): the status follows the outcome. */
  protected markCallDone(f: LearningBondFamily): void {
    this.dialogs
      .open<boolean, LearningBondFamily, LearningBondCallOutcomeDialog>(
        LearningBondCallOutcomeDialog,
        f,
      )
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({ tone: 'success', title: 'Call recorded', text: `${f.name} household` });
        this.load();
      });
  }
}
