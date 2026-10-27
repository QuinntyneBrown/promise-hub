import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  LoadResult,
  MENTORING_API,
  MentorAttendance,
  MentorGuardianContact,
  MentorYouthRecord,
} from '@promisehub/api';
import {
  CallContact,
  Fact,
  PhAlert,
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
  TableCell,
  TableColumn,
  formatDateTime,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

const STATUS: Record<MentorAttendance['status'], TableCell> = {
  CheckedIn: { text: 'Checked in', tone: 'success' },
  SignedOut: { text: 'Signed out', tone: 'neutral' },
  Absent: { text: 'Absent', tone: 'danger' },
};

/**
 * A youth’s record for their mentor (mock: mentor-youth-detail, L2-064). The API sends only what a mentor may see, so the page has
 * nothing to hide; a youth outside the mentor’s scope shows the forbidden state.
 */
@Component({
  selector: 'ph-mentor-youth-detail-page',
  imports: [
    PhAlert,
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

  protected reload(): void {
    this.refresh$.next();
  }
}
