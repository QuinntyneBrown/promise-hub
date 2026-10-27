import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CompetencyLevelItem,
  LEARNING_API,
  LearnerProgressView,
  LoadResult,
} from '@promisehub/api';
import {
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  PhTable,
  PhTabs,
  TabItem,
  TableCell,
  TableColumn,
  formatDay,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

const LEVEL_LABEL: Record<CompetencyLevelItem['level'], string> = {
  NotStarted: 'Not started',
  Developing: 'Developing',
  Proficient: 'Proficient',
  Mastered: 'Mastered',
};
const LEVEL_TONE: Record<CompetencyLevelItem['level'], 'neutral' | 'info' | 'success'> = {
  NotStarted: 'neutral',
  Developing: 'info',
  Proficient: 'success',
  Mastered: 'success',
};

/**
 * Your progress (mock: learn-progress, L2-088): Overview with her numbers and competencies, Quizzes with her history, and Attendance with her
 * sessions only while Roll Call is on; nothing of attendance is shown while it is off.
 */
@Component({
  selector: 'ph-progress-page',
  imports: [
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhStat,
    PhTable,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-page.html',
})
export class ProgressPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();
  protected readonly levelLabel = LEVEL_LABEL;
  protected readonly levelTone = LEVEL_TONE;
  protected readonly tab = signal('overview');

  protected readonly quizColumns: TableColumn[] = [
    { key: 'quiz', label: 'Quiz' },
    { key: 'module', label: 'Module' },
    { key: 'score', label: 'Score' },
    { key: 'result', label: 'Result' },
  ];
  protected readonly sessionColumns: TableColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'session', label: 'Session' },
    { key: 'status', label: 'Status' },
  ];

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<LearnerProgressView> | null>(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() =>
        this.api.progress().pipe(startWith<LoadResult<LearnerProgressView> | null>(null)),
      ),
    ),
    { initialValue: null },
  );

  protected tabs(p: LearnerProgressView): TabItem[] {
    return [
      { value: 'overview', label: 'Overview' },
      { value: 'quizzes', label: 'Quizzes' },
      ...(p.attendance ? [{ value: 'attendance', label: 'Attendance' }] : []),
    ];
  }

  protected percent(part: number, whole: number): string {
    return `${whole ? Math.round((100 * part) / whole) : 0}%`;
  }

  protected weeks(n: number): string {
    return `${n} week${n === 1 ? '' : 's'}`;
  }

  protected average(p: LearnerProgressView): string {
    return p.quizAverage === null ? '—' : `${p.quizAverage}%`;
  }

  protected averageCaption(p: LearnerProgressView): string {
    const n = p.quizzes.filter((q) => q.bestScore !== null).length;
    return n ? `${n} quiz${n === 1 ? '' : 'zes'} scored` : 'No quizzes scored yet';
  }

  protected quizRows(p: LearnerProgressView): Record<string, TableCell>[] {
    return p.quizzes.map((q) => ({
      quiz: q.title,
      module: q.moduleTitle,
      score: q.bestScore === null ? '—' : `${q.bestScore}%`,
      result: q.waiting
        ? { text: 'Waiting', tone: 'info' }
        : q.passed
          ? { text: 'Passed', tone: 'success' }
          : { text: 'Not passed', tone: 'warning' },
    }));
  }

  protected sessionRows(p: LearnerProgressView): Record<string, TableCell>[] {
    return (p.attendance?.sessions ?? []).map((s) => ({
      date: formatDay(s.startsAt),
      session: s.name,
      status:
        s.status === 'Present'
          ? { text: 'Present', tone: 'success' }
          : { text: 'Absent', tone: 'warning' },
    }));
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
