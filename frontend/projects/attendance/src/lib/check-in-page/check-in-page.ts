import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  ATTENDANCE_API,
  AttendanceStatus,
  RosterEntry,
  SESSION_API,
  SLIPS_API,
  SessionSummary,
  SlipClearance,
  can,
} from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhChip,
  PhDialogs,
  PhEmptyState,
  PhErrorPage,
  PhFlag,
  PhPageHeader,
  PhRoster,
  PhRosterItem,
  PhStat,
  PhTextField,
  ToastService,
  formatTime,
  formatWhen,
} from '@promisehub/components';
import { EMPTY, Observable, catchError } from 'rxjs';
import { AddWalkInDialog } from '../add-walk-in-dialog/add-walk-in-dialog';
import { SignOutDialog, SignOutData, SignOutResult } from '../sign-out-dialog/sign-out-dialog';
import {
  CheckInSheetDialog,
  CheckInSheetResult,
} from '../check-in-sheet-dialog/check-in-sheet-dialog';

type Filter = 'all' | 'not-yet' | 'in' | 'absent';

import { EndSessionData, EndSessionDialog } from '../end-session-dialog/end-session-dialog';
import { SessionNotesDialog } from '../session-notes-dialog/session-notes-dialog';
/**
 * Check-in (mock: check-in): tonight's roster with one-tap check-in. Taps update the row and the
 * totals at once and revert if the server refuses (L2-017 criterion 1).
 */
@Component({
  selector: 'ph-check-in-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhChip,
    PhEmptyState,
    PhErrorPage,
    PhFlag,
    PhPageHeader,
    PhRoster,
    PhRosterItem,
    PhStat,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-in-page.html',
  styleUrl: './check-in-page.scss',
})
export class CheckInPage {
  private readonly api = inject(ATTENDANCE_API);
  private readonly slips = inject(SLIPS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  /** Route parameter; without it, the first of today's sessions opens. */
  readonly sessionId = input<string | undefined>(undefined);

  protected readonly state = signal<
    'loading' | 'loaded' | 'none' | 'not-found' | 'forbidden' | 'error'
  >('loading');
  protected readonly session = signal<SessionSummary | null>(null);
  protected readonly entries = signal<RosterEntry[]>([]);
  protected readonly others = signal<SessionSummary[]>([]);
  /** Day-of slip status when the session's event needs a slip and Permission slips is on. */
  protected readonly clearance = signal<SlipClearance | null>(null);
  protected readonly filter = signal<Filter>('all');
  protected readonly query = signal('');
  protected readonly canRun = computed(() => !!this.me() && can(this.me()!.role, 'runSessions'));
  /** Check-in actions are offered only while the session is open; an ended session is read-only. */
  protected readonly live = computed(() => this.canRun() && this.session()?.status === 'Scheduled');
  protected readonly incidents = computed(() => !!this.me()?.modules.includes('Incidents'));
  /** Names open the Quick Card only while that module is on. */
  protected readonly quickCards = computed(() => !!this.me()?.modules.includes('QuickCards'));
  /** Sign out is offered only while the Pickup module is on. */
  protected readonly pickup = computed(() => !!this.me()?.modules.includes('Pickup'));

  protected readonly totals = computed(() => {
    const list = this.entries();
    const checkedIn = list.filter((e) => e.status === 'Present' || e.status === 'SignedOut').length;
    const absent = list.filter((e) => e.status === 'Absent').length;
    return { all: list.length, checkedIn, absent, notYet: list.length - checkedIn - absent };
  });
  protected readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    const order = { Missing: 0, Declined: 1, Cleared: 2 };
    const clearance = this.clearance();
    const rank = (e: RosterEntry) => (clearance ? order[this.slipStatus(e) ?? 'Cleared'] : 0);
    return [...this.entries()]
      .sort((a, b) => rank(a) - rank(b))
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .filter((e) => {
        switch (this.filter()) {
          case 'not-yet':
            return e.status === 'NotYet';
          case 'in':
            return e.status === 'Present' || e.status === 'SignedOut';
          case 'absent':
            return e.status === 'Absent';
          default:
            return true;
        }
      });
  });

  constructor() {
    effect(() => this.load(this.sessionId()));
  }

  protected load(sessionId: string | undefined): void {
    this.state.set('loading');
    this.api.today().subscribe((today) => {
      const sessions = today.status === 'loaded' ? today.value.sessions : [];
      const id = sessionId ?? sessions[0]?.id;
      this.others.set(sessions.filter((s) => s.id !== id));
      if (!id) {
        this.state.set(today.status === 'error' ? 'error' : 'none');
        return;
      }
      this.api.roster(id).subscribe((roster) => {
        if (roster.status === 'loaded') {
          this.session.set(roster.value.session);
          this.entries.set(roster.value.children);
          this.loadClearance(id);
          this.state.set('loaded');
        } else {
          this.state.set(
            roster.status === 'not-found' || roster.status === 'forbidden'
              ? roster.status
              : 'error',
          );
        }
      });
    });
  }

  protected loadClearance(sessionId: string): void {
    this.clearance.set(null);
    if (!this.me()?.modules.includes('Slips')) return;
    this.slips
      .clearance(sessionId)
      .subscribe((r) => this.clearance.set(r.status === 'loaded' ? r.value : null));
  }

  protected slipStatus(e: RosterEntry): 'Cleared' | 'Missing' | 'Declined' | null {
    return this.clearance()?.children.find((c) => c.childId === e.childId)?.status ?? null;
  }

  protected householdOf(e: RosterEntry): string | null {
    return this.clearance()?.children.find((c) => c.childId === e.childId)?.householdId ?? null;
  }

  protected rowStatus(e: RosterEntry): 'not-yet' | 'in' | 'out' | 'absent' {
    return e.status === 'Present'
      ? 'in'
      : e.status === 'SignedOut'
        ? 'out'
        : e.status === 'Absent'
          ? 'absent'
          : 'not-yet';
  }

  protected meta(e: RosterEntry): string {
    const status =
      e.status === 'Present' && e.checkedInAt
        ? `Checked in ${formatTime(new Date(e.checkedInAt))}`
        : e.status === 'Absent'
          ? 'Absent'
          : e.status === 'SignedOut'
            ? [
                e.signedOutAt ? `Signed out ${formatTime(new Date(e.signedOutAt))}` : 'Signed out',
                e.collectedBy,
              ]
                .filter(Boolean)
                .join(' · ')
            : 'Not yet here';
    return [status, e.school?.split(', ')[1] ?? null].filter(Boolean).join(' · ');
  }

  protected endSession(s: SessionSummary): void {
    const stillIn = this.entries().filter((e) => e.status === 'Present').length;
    this.dialogs
      .open<boolean, EndSessionData, EndSessionDialog>(EndSessionDialog, {
        sessionId: s.id,
        name: s.name,
        notYet: s.notYet,
        stillIn,
        endTime: formatTime(new Date(s.endsAt)),
      })
      .closed.subscribe((done) => {
        if (done) this.load(s.id);
      });
  }

  protected editNotes(s: SessionSummary): void {
    this.dialogs
      .open<
        boolean,
        { sessionId: string; notes: string | null; incidents: boolean },
        SessionNotesDialog
      >(SessionNotesDialog, {
        sessionId: s.id,
        notes: s.notes ?? null,
        incidents: this.incidents(),
      })
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({
          tone: 'success',
          title: 'Notes saved',
          text: 'The next site lead can read them.',
        });
        this.load(s.id);
      });
  }

  protected recordedText(s: SessionSummary): string {
    return `${s.checkedIn} present, ${s.absent} absent. Attendance saved.`;
  }

  protected subtitle(s: SessionSummary): string {
    return [formatWhen(s.startsAt, s.endsAt), s.place, `${s.expected} on roster`]
      .filter(Boolean)
      .join(' · ');
  }

  /** One tap: the row and totals change now; the server confirms or the change is undone. */
  protected checkIn(entry: RosterEntry, arrivedAt: string | null = null): void {
    this.apply(entry, 'Present', arrivedAt ?? new Date().toISOString(), (session, action) =>
      this.api.checkIn(session, entry.id, arrivedAt, action),
    );
  }

  protected markAbsent(entry: RosterEntry): void {
    this.apply(entry, 'Absent', null, (session, action) =>
      this.api.markAbsent(session, entry.id, action),
    );
  }

  protected options(entry: RosterEntry): void {
    this.dialogs
      .open<CheckInSheetResult, RosterEntry, CheckInSheetDialog>(CheckInSheetDialog, entry)
      .closed.subscribe((result) => {
        if (result?.kind === 'check-in') this.checkIn(entry, result.arrivedAt);
        if (result?.kind === 'absent') this.markAbsent(entry);
      });
  }

  protected signOut(entry: RosterEntry): void {
    const session = this.session();
    if (!session) return;
    this.dialogs
      .open<SignOutResult, SignOutData, SignOutDialog>(SignOutDialog, {
        sessionId: session.id,
        entry,
      })
      .closed.subscribe((result) => {
        if (!result) return;
        const at = new Date();
        this.patch(entry.id, {
          status: 'SignedOut',
          signedOutAt: at.toISOString(),
          collectedBy: result.collectedBy,
        });
        this.toasts.show({
          tone: 'success',
          title: `${entry.name} signed out`,
          text: `With ${result.collectedBy} at ${formatTime(at)}`,
        });
      });
  }

  protected addWalkIn(): void {
    const session = this.session();
    if (!session) return;
    this.dialogs
      .open<boolean, { session: SessionSummary; name: string }, AddWalkInDialog>(AddWalkInDialog, {
        session,
        name: this.query(),
      })
      .closed.subscribe((added) => {
        if (added) {
          this.query.set('');
          this.load(session.id);
        }
      });
  }

  private apply(
    entry: RosterEntry,
    status: AttendanceStatus,
    checkedInAt: string | null,
    send: (sessionId: string, actionId: string) => Observable<{ status: string }>,
  ): void {
    const session = this.session();
    if (!session) return;
    const previous = { status: entry.status, checkedInAt: entry.checkedInAt };
    this.patch(entry.id, { status, checkedInAt });
    send(session.id, crypto.randomUUID()).subscribe((outcome) => {
      if (outcome.status === 'saved') {
        if (status === 'Present') {
          const t = this.totals();
          this.toasts.show({
            tone: 'success',
            title: `${entry.name} checked in`,
            text: `${t.checkedIn} of ${t.all} now here`,
          });
        } else {
          this.toasts.show({ tone: 'info', title: `${entry.name} marked absent` });
        }
      } else {
        this.patch(entry.id, previous);
        this.toasts.show({
          tone: 'danger',
          title:
            status === 'Present'
              ? `${entry.name} was not checked in`
              : `${entry.name} was not marked absent`,
          text: 'Try again.',
        });
      }
    });
  }

  private patch(id: string, changes: Partial<RosterEntry>): void {
    this.entries.update((list) => list.map((e) => (e.id === id ? { ...e, ...changes } : e)));
  }

  /** The no-show text on a row (L2-018): sent, or what the guardian replied. */
  protected noShowText(e: RosterEntry): string {
    const at = e.noShowAt ? formatTime(new Date(e.noShowAt)) : '';
    return e.noShow === 'TextSent'
      ? `Guardian texted ${at}`
      : e.noShow === 'OnTheWay'
        ? 'On the way · guardian replied'
        : 'Absent · guardian replied';
  }
}
