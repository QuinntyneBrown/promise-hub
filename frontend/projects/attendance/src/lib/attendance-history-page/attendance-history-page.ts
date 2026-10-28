import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ATTENDANCE_API,
  AttendanceHistory,
  LoadResult,
  SessionAttendanceRow,
  SessionAttendanceStatus,
} from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorPage,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhStat,
  PhTable,
  PhTabs,
  TabItem,
  TableCell,
  TableColumn,
  formatDay,
} from '@promisehub/components';
import { Subject, combineLatest, map, startWith, switchMap } from 'rxjs';

const STATUS: Record<
  SessionAttendanceStatus,
  { text: string; tone: 'success' | 'info' | 'danger' | 'warning' }
> = {
  InProgress: { text: 'In progress', tone: 'info' },
  NotRecorded: { text: 'Not recorded', tone: 'danger' },
  Recorded: { text: 'Recorded', tone: 'success' },
  NeedsReview: { text: 'Needs review', tone: 'warning' },
};

/**
 * Attendance history (mock: attendance-history, L2-097): a cohort's sessions so far with present, late, excused and absent and a rate,
 * and each youth with sessions attended of marked, those below 70% flagged. Admins and program directors correct a mark (ADR 0065).
 */
@Component({
  selector: 'ph-attendance-history-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhStat,
    PhTable,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-history-page.html',
})
export class AttendanceHistoryPage {
  private readonly api = inject(ATTENDANCE_API);
  private readonly router = inject(Router);
  private readonly refresh$ = new Subject<void>();

  /** The cohort in the address (`?programId=`); without it, the first the caller may choose. */
  readonly programId = input<string | undefined>(undefined);

  protected readonly view = signal('session');
  protected readonly views: TabItem[] = [
    { value: 'session', label: 'By session' },
    { value: 'youth', label: 'By youth' },
  ];

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<AttendanceHistory> | null>(
    combineLatest([toObservable(this.programId), this.refresh$.pipe(startWith(undefined))]).pipe(
      map(([id]) => id),
      switchMap((id) =>
        this.api.history(id).pipe(startWith<LoadResult<AttendanceHistory> | null>(null)),
      ),
    ),
    { initialValue: null },
  );

  protected readonly history = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });

  protected readonly sessionColumns: TableColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'session', label: 'Session' },
    { key: 'present', label: 'Present', numeric: true },
    { key: 'late', label: 'Late', numeric: true },
    { key: 'excused', label: 'Excused', numeric: true },
    { key: 'absent', label: 'Absent', numeric: true },
    { key: 'rate', label: 'Rate', numeric: true },
    { key: 'status', label: 'Status' },
  ];
  protected readonly youthColumns: TableColumn[] = [
    { key: 'youth', label: 'Youth' },
    { key: 'attended', label: 'Attended', numeric: true },
    { key: 'late', label: 'Late', numeric: true },
    { key: 'excused', label: 'Excused', numeric: true },
    { key: 'absent', label: 'Absent', numeric: true },
    { key: 'rate', label: 'Rate', numeric: true },
  ];

  protected rate(value: number | null): string {
    return value === null ? '—' : `${value}%`;
  }

  protected subtitle(h: AttendanceHistory): string {
    return [h.programName, h.schedule, `${h.youth.length} youth`].filter(Boolean).join(' · ');
  }

  protected cohortOptions(h: AttendanceHistory): { value: string; label: string }[] {
    return h.cohorts.map((c) => ({ value: c.id, label: c.name }));
  }

  protected choose(programId: string): void {
    void this.router.navigate([], { queryParams: { programId } });
  }

  /** The latest session that is over and has no attendance (L2-097 criterion 1). */
  protected unrecorded(h: AttendanceHistory): SessionAttendanceRow | null {
    return h.sessions.find((s) => s.status === 'NotRecorded') ?? null;
  }

  protected day(iso: string): string {
    return formatDay(iso);
  }

  protected sessionRows(h: AttendanceHistory): Record<string, TableCell>[] {
    return h.sessions.map((s) => {
      const marked = s.present + s.late + s.excused + s.absent > 0;
      return {
        date: formatDay(s.startsAt),
        session: s.name,
        present: `${s.present}`,
        late: `${s.late}`,
        excused: `${s.excused}`,
        absent: `${s.absent}`,
        rate: marked ? this.rate(s.rate) : '—',
        status: STATUS[s.status],
      };
    });
  }

  protected youthRows(h: AttendanceHistory): Record<string, TableCell>[] {
    return h.youth.map((y) => ({
      youth: y.belowThreshold
        ? { text: y.name, badge: { text: 'Below 70%', tone: 'warning' } }
        : y.name,
      attended: `${y.attended} / ${y.marked}`,
      late: `${y.late}`,
      excused: `${y.excused}`,
      absent: `${y.absent}`,
      rate: this.rate(y.rate),
    }));
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
