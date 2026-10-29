import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, ModuleId, REPORTS_API, SESSION_API, YouthReport } from '@promisehub/api';
import {
  BreadcrumbItem,
  Fact,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhErrorPage,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  PhTable,
  TableCell,
  TableColumn,
  formatDate,
} from '@promisehub/components';
import { EMPTY, catchError, map } from 'rxjs';

const STATE: Record<string, { text: string; tone: 'success' | 'info' | 'neutral' }> = {
  Done: { text: 'Done', tone: 'success' },
  InProgress: { text: 'In progress', tone: 'info' },
  NotStarted: { text: 'Not started', tone: 'neutral' },
};

/**
 * The youth report (mock: report-youth, L2-127): one child's learning, attendance and mentoring for a meeting or a funder, each while its
 * module is on. Mentor check-ins are counted, never quoted (ADR 0061).
 */
@Component({
  selector: 'ph-youth-report-page',
  imports: [
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
    PhSkeleton,
    PhStat,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './youth-report-page.html',
  styleUrl: './youth-report-page.css',
})
export class YouthReportPage {
  private readonly api = inject(REPORTS_API);
  private readonly childId = inject(ActivatedRoute).snapshot.paramMap.get('childId')!;

  private readonly modules = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(
        map((s) => s.modules),
        catchError(() => EMPTY),
      ),
    { initialValue: [] as ModuleId[] },
  );
  /** Learning is mentioned (a child without an account) only while it is on. */
  protected readonly learningOn = computed(() => this.modules().includes('Learning'));
  protected readonly result = signal<LoadResult<YouthReport> | null>(null);
  protected readonly report = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Reports', link: '/reports' },
    { label: 'Youth report' },
  ];
  protected readonly moduleColumns: TableColumn[] = [
    { key: 'title', label: 'Module' },
    { key: 'lessons', label: 'Lessons', numeric: true },
    { key: 'state', label: 'Status' },
  ];
  protected readonly quizColumns: TableColumn[] = [
    { key: 'title', label: 'Quiz' },
    { key: 'score', label: 'Best score', numeric: true },
  ];
  protected readonly moduleRows = computed<Record<string, TableCell>[]>(() =>
    (this.report()?.learning?.modules ?? []).map((m) => ({
      title: m.title,
      lessons: `${m.done} of ${m.total}`,
      state: STATE[m.state],
    })),
  );
  protected readonly quizRows = computed<Record<string, TableCell>[]>(() =>
    (this.report()?.learning?.quizzes ?? []).map((q) => ({
      title: q.title,
      score: `${q.bestScore}%`,
    })),
  );
  protected readonly attendanceFacts = computed<Fact[]>(() => {
    const a = this.report()?.attendance;
    if (!a) return [];
    return [
      { key: 'present', term: 'Present', value: `${a.present}` },
      { key: 'late', term: 'Late', value: `${a.late}` },
      { key: 'excused', term: 'Excused', value: `${a.excused}` },
      { key: 'absent', term: 'Absent', value: `${a.absent}` },
    ];
  });
  protected readonly mentoringFacts = computed<Fact[]>(() => {
    const m = this.report()?.mentoring;
    if (!m) return [];
    return [
      { key: 'mentor', term: 'Mentor', value: m.mentorName ?? 'No mentor yet' },
      { key: 'check-ins', term: 'Check-ins', value: `${m.checkIns}` },
      {
        key: 'latest',
        term: 'Latest',
        value: m.latestOn
          ? `${formatDate(m.latestOn)}${m.latestEngagement ? ' · ' + m.latestEngagement : ''}`
          : 'No check-in yet',
      },
      { key: 'flag', term: 'At-risk flag', value: m.openFlag ? 'Open' : 'None' },
    ];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.youth(this.childId).subscribe((r) => this.result.set(r));
  }

  protected subtitle(r: YouthReport): string {
    return ['Youth report', r.programs.join(', ') || null, r.age === null ? null : `${r.age}`]
      .filter(Boolean)
      .join(' · ');
  }

  protected firstName(r: YouthReport): string {
    return r.name.split(' ')[0];
  }

  protected percent(value: number | null): string {
    return value === null ? '—' : `${value}%`;
  }

  protected print(): void {
    window.print();
  }
}
