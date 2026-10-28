import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  LoadResult,
  MENTORING_API,
  MentorAttendance,
  MentorCheckIn,
  MentorCheckInHistory,
  MentorGuardianContact,
  MentorYouthRecord,
  SESSION_API,
  SharedReflection,
  SharedReflections,
} from '@promisehub/api';
import {
  CallContact,
  Fact,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCallList,
  PhCard,
  PhDialogs,
  PhDescriptionList,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhTable,
  TableCell,
  TableColumn,
  ToastService,
  formatDateTime,
  formatDay,
} from '@promisehub/components';
import { MentorCheckInDialog } from '../mentor-check-in-dialog/mentor-check-in-dialog';
import { MentorCheckInDialogData } from '../mentor-check-in-dialog-data';
import { KIND_LABEL, checkInCaption, checkInMeta } from '../check-in-words';
import { EMPTY, Subject, catchError, combineLatest, filter, map, startWith, switchMap } from 'rxjs';

const STATUS: Record<MentorAttendance['status'], TableCell> = {
  CheckedIn: { text: 'Checked in', tone: 'success' },
  SignedOut: { text: 'Signed out', tone: 'neutral' },
  Absent: { text: 'Absent', tone: 'danger' },
};

/**
 * A youth’s record for their mentor (mock: mentor-youth-detail, L2-064). The API sends only what a mentor may see, so the page has
 * nothing to hide; a youth outside the mentor’s scope shows the forbidden state. While Learning is on, the reflections she shared are
 * listed newest first (L2-089 criterion 5); while it is off nothing about them is fetched or shown.
 */
@Component({
  selector: 'ph-mentor-youth-detail-page',
  imports: [
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCallList,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-youth-detail-page.html',
})
export class MentorYouthDetailPage {
  private readonly api = inject(MENTORING_API);
  private readonly refresh$ = new Subject<void>();
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);

  /** Route parameter. */
  readonly childId = input.required<string>();

  protected readonly columns: TableColumn[] = [
    { key: 'session', label: 'Session' },
    { key: 'when', label: 'When' },
    { key: 'status', label: 'Status' },
  ];

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<MentorYouthRecord> | null>(
    toObservable(this.childId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.youthRecord(id).pipe(startWith<LoadResult<MentorYouthRecord> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  /** The reflections she shared, only while Learning is on; null while off or loading. */
  protected readonly reflections = toSignal<LoadResult<SharedReflections> | null>(
    combineLatest([
      inject(SESSION_API)
        .current()
        .pipe(
          map((session) => session.modules.includes('Learning')),
          catchError(() => EMPTY),
        ),
      toObservable(this.childId),
    ]).pipe(
      filter(([learning]) => learning),
      switchMap(([, id]) => this.api.sharedReflections(id)),
    ),
    { initialValue: null },
  );

  private readonly checkIns$ = new Subject<void>();
  protected readonly checkInMeta = checkInMeta;
  protected readonly checkInCaption = checkInCaption;

  /** His mentor check-ins with this youth, newest first (L2-090 criterion 5); null while loading. */
  protected readonly checkIns = toSignal<LoadResult<MentorCheckInHistory> | null>(
    toObservable(this.childId).pipe(
      switchMap((id) =>
        this.checkIns$.pipe(
          startWith(undefined),
          switchMap(() => this.api.checkIns({ childId: id })),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected kindAndDate(c: MentorCheckIn): string {
    return `${KIND_LABEL[c.kind]} · ${formatDay(c.date)}`;
  }

  protected firstName(y: MentorYouthRecord): string {
    return y.preferredName ?? y.name.split(' ')[0] ?? y.name;
  }

  protected reflectionMeta(r: SharedReflection): string {
    return `${r.moduleTitle} · Feeling ${r.mood.toLowerCase()} · ${formatDateTime(r.savedAt)}`;
  }

  protected subtitle(r: MentorYouthRecord): string {
    return [r.age !== null ? `Age ${r.age}` : null, r.school].filter(Boolean).join(' · ');
  }

  protected about(r: MentorYouthRecord): Fact[] {
    return [
      { key: 'programs', term: 'Programs', value: r.programs.join(', ') || 'None right now' },
      { key: 'mentor', term: 'Mentor', value: r.mentor ?? 'Through a cohort you’re on' },
      { key: 'goes-by', term: 'Goes by', value: r.preferredName ?? 'Not set' },
      { key: 'pronouns', term: 'Pronouns', value: r.pronouns ?? 'Not set' },
    ];
  }

  protected callable(r: MentorYouthRecord): CallContact[] {
    return r.guardians
      .filter((g) => g.mobile)
      .map((g) => ({
        name: g.name,
        relationship: g.relationship,
        meta: [g.isPrimary ? 'Primary contact' : null, g.email].filter(Boolean).join(' · ') || null,
        phone: g.mobile!,
      }));
  }

  protected noMobile(r: MentorYouthRecord): MentorGuardianContact[] {
    return r.guardians.filter((g) => !g.mobile);
  }

  protected rows(attendance: MentorAttendance[]): Record<string, TableCell>[] {
    return attendance.map((a) => ({
      session: a.session,
      when: formatDateTime(a.at),
      status: STATUS[a.status],
    }));
  }

  /** Opens the mentor check-in dialog with this youth fixed (L2-090 criterion 1). */
  protected logCheckIn(y: MentorYouthRecord): void {
    this.dialogs
      .open<string, MentorCheckInDialogData, MentorCheckInDialog>(MentorCheckInDialog, {
        youth: [],
        fixed: { id: y.id, name: y.name },
      })
      .closed.subscribe((name) => {
        if (name === undefined) return;
        this.toasts.show({ tone: 'success', title: 'Mentor check-in saved', text: name });
        this.checkIns$.next();
      });
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
