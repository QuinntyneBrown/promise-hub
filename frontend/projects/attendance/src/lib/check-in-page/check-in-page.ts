import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  QUICK_CARD_API,
  AttendanceStatus,
  RosterEntry,
  SESSION_API,
  SLIPS_API,
  PARTICIPANT_ROLES,
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
  PhSyncChip,
  PhTextField,
  ToastService,
  formatTime,
  formatWhen,
} from '@promisehub/components';
import { EMPTY, Observable, catchError, forkJoin } from 'rxjs';
import { AddWalkInDialog } from '../add-walk-in-dialog/add-walk-in-dialog';
import { CheckInSheetData } from '../check-in-sheet-dialog/check-in-sheet-data';
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
    PhSyncChip,
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
  private readonly cards = inject(QUICK_CARD_API);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  /** Route parameter; without it, the first of today's sessions opens. */
  readonly sessionId = input<string | undefined>(undefined);

  protected readonly state = signal<
    'loading' | 'loaded' | 'none' | 'not-found' | 'forbidden' | 'error' | 'offline'
  >('loading');
  /** Check-ins and absences made without signal, waiting to send (L2-028). */
  protected readonly queue = signal(this.api.queued());
  protected readonly queuedIds = computed(() => new Set(this.queue().map((a) => a.childId)));
  /** When the roster came from this phone without signal: the time it was saved. */
  protected readonly savedAt = signal<string | null>(null);
  protected readonly session = signal<SessionSummary | null>(null);
  protected readonly entries = signal<RosterEntry[]>([]);
  protected readonly others = signal<SessionSummary[]>([]);
  /** Day-of slip status when the session's event needs a slip and Permission slips is on. */
  protected readonly clearance = signal<SlipClearance | null>(null);
  protected readonly filter = signal<Filter>('all');
  protected readonly query = signal('');
  protected readonly canRun = computed(() => !!this.me() && can(this.me()!.role, 'runSessions'));
  /** Attendance history is for those who review attendance: admins, directors, site leads and mentors (L2-097). */
  protected readonly reviews = computed(
    () => !!this.me() && can(this.me()!.role, 'reviewAttendance'),
  );
  /** Check-in actions are offered only while the session is open; an ended session is read-only. */
  protected readonly live = computed(() => this.canRun() && this.session()?.status === 'Scheduled');
  protected readonly incidents = computed(() => !!this.me()?.modules.includes('Incidents'));
  /** Mentors and volunteers run sessions without the staff app: no Quick Cards or approved pickups (ADR 0065). */
  protected readonly staff = computed(
    () => !!this.me() && !PARTICIPANT_ROLES.includes(this.me()!.role),
  );
  /** Names open the Quick Card only while that module is on, and only for staff. */
  protected readonly quickCards = computed(
    () => this.staff() && !!this.me()?.modules.includes('QuickCards'),
  );
  /** Sign out is offered only while the Pickup module is on, and only to staff. */
  protected readonly pickup = computed(
    () => this.staff() && !!this.me()?.modules.includes('Pickup'),
  );
  /** Late and excused are for staff and mentors; volunteers mark Present or Absent only (L2-100). */
  protected readonly qualifies = computed(
    () => !!this.me() && can(this.me()!.role, 'qualifyAttendance'),
  );
  /** Why a session is closed to the caller, in words for the role (L2-007 criterion 6, L2-100 criterion 5). */
  protected readonly forbiddenCopy = computed(() =>
    this.me()?.role === 'Volunteer'
      ? {
          title: 'You’re not assigned to this session',
          text: 'Volunteers open the sessions they’re assigned to. Ask your volunteer coordinator to add you.',
        }
      : {
          title: 'You’re not on this session',
          text: 'Youth workers open the sessions they work. Ask a site lead to add you.',
        },
  );
  /** Who is still to be marked while the session is open (L2-095 criterion 3). */
  protected readonly notYet = computed(() =>
    this.live() ? this.entries().filter((e) => e.status === 'NotYet') : [],
  );

  protected readonly totals = computed(() => {
    const list = this.entries();
    const checkedIn = list.filter((e) => e.status === 'Present' || e.status === 'SignedOut').length;
    const absent = list.filter((e) => e.status === 'Absent').length;
    const late = list.filter(
      (e) => (e.status === 'Present' || e.status === 'SignedOut') && e.late,
    ).length;
    const excused = list.filter((e) => e.status === 'Absent' && e.excused).length;
    return {
      all: list.length,
      checkedIn,
      absent,
      late,
      excused,
      notYet: list.length - checkedIn - absent,
    };
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
    const online = () => this.sync();
    window.addEventListener('online', online);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('online', online));
  }

  /** Sends what waited for signal, in order, then shows the server's roster again. */
  protected sync(): void {
    if (!this.queue().length) return;
    this.api.sync().subscribe((sent) => {
      this.queue.set(this.api.queued());
      if (!sent) return;
      this.toasts.show({
        tone: 'success',
        title: `${sent} check-in${sent === 1 ? '' : 's'} synced`,
        text: 'The roster is up to date.',
      });
      this.load(this.session()?.id);
    });
  }

  protected load(sessionId: string | undefined): void {
    this.state.set('loading');
    this.api.today().subscribe((today) => {
      const sessions = today.status === 'loaded' ? today.value.sessions : [];
      const id = sessionId ?? sessions[0]?.id;
      this.others.set(sessions.filter((s) => s.id !== id));
      if (!id) {
        this.state.set(
          today.status === 'offline' ? 'offline' : today.status === 'error' ? 'error' : 'none',
        );
        return;
      }
      this.api.roster(id).subscribe((roster) => {
        if (roster.status === 'loaded') {
          this.session.set(roster.value.session);
          this.entries.set(roster.value.children);
          this.savedAt.set(roster.value.savedAt ?? null);
          if (!roster.value.savedAt) this.saveQuickCards(roster.value.children);
          this.loadClearance(id);
          this.state.set('loaded');
        } else {
          this.state.set(
            roster.status === 'not-found' ||
              roster.status === 'forbidden' ||
              roster.status === 'offline'
              ? roster.status
              : 'error',
          );
        }
      });
    });
  }

  /** Loads every Quick Card on tonight's roster while there is signal, so each opens without it (L2-028 criterion 1). */
  private saveQuickCards(children: RosterEntry[]): void {
    if (!this.quickCards()) return;
    for (const c of children) if (c.childId) this.cards.get(c.childId).subscribe();
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

  protected rowStatus(e: RosterEntry): 'not-yet' | 'in' | 'out' | 'absent' | 'queued' {
    if (this.queuedIds().has(e.id)) return 'queued';
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
        ? `${e.late ? 'Late · checked' : 'Checked'} in ${formatTime(new Date(e.checkedInAt))}`
        : e.status === 'Absent'
          ? e.excused
            ? 'Excused'
            : 'Absent'
          : e.status === 'SignedOut'
            ? [
                e.late ? 'Late' : null,
                e.signedOutAt ? `Signed out ${formatTime(new Date(e.signedOutAt))}` : 'Signed out',
                e.collectedBy,
              ]
                .filter(Boolean)
                .join(' · ')
            : 'Not yet here';
    const extra = this.queuedIds().has(e.id)
      ? 'waiting to sync'
      : (e.school?.split(', ')[1] ?? null);
    return [status, extra].filter(Boolean).join(' · ');
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

  protected savedText(): string {
    const n = this.queue().length;
    const at = this.savedAt();
    return [
      at ? `Roster saved ${formatTime(new Date(at))}.` : null,
      n ? `${n} waiting to sync.` : null,
    ]
      .filter(Boolean)
      .join(' ');
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
  protected checkIn(entry: RosterEntry, arrivedAt: string | null = null, late = false): void {
    this.apply(
      entry,
      {
        status: 'Present',
        checkedInAt: arrivedAt ?? new Date().toISOString(),
        late,
        excused: false,
      },
      (session, action) => this.api.checkIn(session, entry.id, arrivedAt, action, late),
    );
  }

  /** Checks in everyone not yet here, one action each, then says how many in one toast (L2-095 criterion 3). */
  protected markRestPresent(): void {
    const session = this.session();
    const rest = this.notYet();
    if (!session || !rest.length) return;
    const at = new Date().toISOString();
    for (const e of rest) this.patch(e.id, { status: 'Present', checkedInAt: at, late: false });
    forkJoin(
      rest.map((e) => this.api.checkIn(session.id, e.id, null, crypto.randomUUID())),
    ).subscribe((outcomes) => {
      const failed = rest.filter((_, i) => !['saved', 'queued'].includes(outcomes[i]!.status));
      for (const e of failed) this.patch(e.id, { status: e.status, checkedInAt: e.checkedInAt });
      this.queue.set(this.api.queued());
      const done = rest.length - failed.length;
      if (done)
        this.toasts.show({
          tone: 'success',
          title: `${done} marked present`,
          text: failed.length
            ? `${failed.length} could not be checked in. Try again.`
            : 'Everyone on the roster is marked.',
        });
      else this.toasts.show({ tone: 'danger', title: 'No one was checked in', text: 'Try again.' });
    });
  }

  protected markAbsent(entry: RosterEntry, excused = false): void {
    this.apply(
      entry,
      { status: 'Absent', checkedInAt: null, late: false, excused },
      (session, action) => this.api.markAbsent(session, entry.id, action, excused),
    );
  }

  protected options(entry: RosterEntry): void {
    this.dialogs
      .open<CheckInSheetResult, CheckInSheetData, CheckInSheetDialog>(CheckInSheetDialog, {
        entry,
        qualifiers: this.qualifies(),
      })
      .closed.subscribe((result) => {
        if (result?.kind === 'check-in') this.checkIn(entry, result.arrivedAt, result.late);
        if (result?.kind === 'absent') this.markAbsent(entry, result.excused);
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
    mark: Pick<RosterEntry, 'status' | 'checkedInAt' | 'late' | 'excused'>,
    send: (sessionId: string, actionId: string) => Observable<{ status: string }>,
  ): void {
    const session = this.session();
    if (!session) return;
    const status: AttendanceStatus = mark.status;
    const previous = {
      status: entry.status,
      checkedInAt: entry.checkedInAt,
      late: entry.late,
      excused: entry.excused,
    };
    this.patch(entry.id, mark);
    send(session.id, crypto.randomUUID()).subscribe((outcome) => {
      if (outcome.status === 'queued') {
        this.queue.set(this.api.queued());
        this.toasts.show({
          tone: 'info',
          title: `${entry.name} saved on this phone`,
          text: 'It sends when you have signal.',
        });
      } else if (outcome.status === 'saved') {
        if (status === 'Present') {
          const t = this.totals();
          this.toasts.show({
            tone: 'success',
            title: `${entry.name} checked in${mark.late ? ' late' : ''}`,
            text: `${t.checkedIn} of ${t.all} now here`,
          });
        } else {
          this.toasts.show({
            tone: 'info',
            title: `${entry.name} marked ${mark.excused ? 'excused' : 'absent'}`,
          });
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
