import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  GradeOutcome,
  GradeRequest,
  LoadResult,
  MENTORING_API,
  SubmissionReview,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  Fact,
  PhAlert,
  PhAvatar,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhTextField,
  PhTextarea,
  ToastService,
  formatDateTime,
} from '@promisehub/components';
import { Observable, Subject, map, of, startWith, switchMap } from 'rxjs';
import { ApproveSubmissionDialog } from '../approve-submission-dialog/approve-submission-dialog';
import { CanLeave } from '../can-leave';
import { GradeDialogData } from '../grade-dialog-data';
import { LeaveChoice } from '../leave-choice';
import { LeaveGradeDialog } from '../leave-grade-dialog/leave-grade-dialog';
import { RequestRevisionDialog } from '../request-revision-dialog/request-revision-dialog';
import { REVIEW_LABEL, REVIEW_TONE, firstName } from '../review-words';

interface Snapshot {
  scores: string[];
  comment: string;
}

/**
 * Grading a submission (mock: mentor-grade, L2-080 criteria 2 to 8, L2-083 criterion 1): what the youth sent beside the rubric, a score per
 * criterion with the total, the comment, Save draft, Request revision and Approve. Scores are checked here before anything is sent and
 * again on the server; a stale save keeps everything entered and offers the latest; leaving with unsaved changes asks first.
 */
@Component({
  selector: 'ph-grade-page',
  imports: [
    FormsModule,
    PhAlert,
    PhAvatar,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorSummary,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grade-page.html',
  styleUrl: './grade-page.css',
})
export class GradePage implements CanLeave {
  private readonly api = inject(MENTORING_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly label = REVIEW_LABEL;
  protected readonly tone = REVIEW_TONE;
  protected readonly first = firstName;

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<SubmissionReview> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api
              .submissionReview(id)
              .pipe(startWith<LoadResult<SubmissionReview> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly scores = signal<string[]>([]);
  protected readonly comment = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly conflict = signal(false);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  private readonly saved = signal<Snapshot>({ scores: [], comment: '' });

  protected readonly total = computed(() =>
    this.scores().reduce((n, s) => n + (this.whole(s) ?? 0), 0),
  );
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: this.fieldId(key), message })),
  );
  private readonly dirty = computed(() => {
    const s = this.saved();
    return s.comment !== this.comment() || s.scores.join('|') !== this.scores().join('|');
  });

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status !== 'loaded') return;
      const snapshot: Snapshot = {
        scores: r.value.rubric.map((c) => (c.score === null ? '' : String(c.score))),
        comment: r.value.comment ?? '',
      };
      this.saved.set(snapshot);
      this.scores.set([...snapshot.scores]);
      this.comment.set(snapshot.comment);
      this.errors.set({});
      this.conflict.set(false);
    });
  }

  protected reviewing(s: SubmissionReview): boolean {
    return s.status === 'Submitted' || s.status === 'InReview';
  }

  protected subtitle(s: SubmissionReview): string {
    return `${s.youthName} · ${s.moduleTitle} · submitted ${formatDateTime(s.submittedAt)}${s.late ? ' · late' : ''}`;
  }

  protected fileMeta(s: SubmissionReview): string {
    const f = s.file!;
    const size =
      f.bytes >= 1024 * 1024
        ? `${(f.bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(f.bytes / 1024))} KB`;
    return `${f.kind} · ${size}`;
  }

  protected fileUrl(s: SubmissionReview): string {
    return this.api.submissionFileUrl(s.id);
  }

  protected outcome(s: SubmissionReview): Fact[] {
    return s.status === 'Accepted'
      ? [
          { key: 'points', term: 'Points', value: `${s.points} / ${s.totalPoints}` },
          { key: 'comment', term: 'Comment', value: s.feedback ?? 'No comment' },
        ]
      : [{ key: 'note', term: 'Your note', value: s.feedback ?? '' }];
  }

  protected setScore(i: number, value: string | number | null): void {
    this.scores.update((all) =>
      all.map((s, j) => (j === i ? (value === null ? '' : String(value)) : s)),
    );
  }

  protected saveDraft(s: SubmissionReview): void {
    if (!this.check(s, false)) return;
    this.send(s, 'draft').subscribe();
  }

  protected approve(s: SubmissionReview): void {
    if (!this.check(s, true)) return;
    this.dialogs
      .open<GradeOutcome, GradeDialogData, ApproveSubmissionDialog>(
        ApproveSubmissionDialog,
        this.dialogData(s, 'approve'),
      )
      .closed.subscribe((outcome) => outcome && this.settle(outcome, 'approve', s));
  }

  protected requestRevision(s: SubmissionReview): void {
    if (!this.check(s, false)) return;
    this.dialogs
      .open<GradeOutcome, GradeDialogData, RequestRevisionDialog>(
        RequestRevisionDialog,
        this.dialogData(s, 'revise'),
      )
      .closed.subscribe((outcome) => outcome && this.settle(outcome, 'revise', s));
  }

  protected loadLatest(): void {
    this.conflict.set(false);
    this.refresh$.next();
  }

  protected reload(): void {
    this.refresh$.next();
  }

  canLeave(): Observable<boolean> | boolean {
    const r = this.result();
    if (r?.status !== 'loaded' || !this.reviewing(r.value) || !this.dirty()) return true;
    const s = r.value;
    return this.dialogs
      .open<LeaveChoice, null, LeaveGradeDialog>(LeaveGradeDialog, null)
      .closed.pipe(
        switchMap((choice) =>
          choice === 'discard'
            ? of(true)
            : choice === 'save' && this.check(s, false)
              ? this.send(s, 'draft')
              : of(false),
        ),
      );
  }

  @HostListener('window:beforeunload', ['$event'])
  protected warn(event: BeforeUnloadEvent): void {
    const r = this.result();
    if (r?.status === 'loaded' && this.reviewing(r.value) && this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  /** Each score a whole number within its points; with approve, every criterion scored. */
  private check(s: SubmissionReview, approving: boolean): boolean {
    const errors: Record<string, string> = {};
    s.rubric.forEach((c, i) => {
      const raw = this.scores()[i] ?? '';
      const points = this.whole(raw);
      if (raw.trim() !== '' && (points === null || points < 0 || points > c.points))
        errors[`scores.${i}`] = `Give 0 to ${c.points} points.`;
      else if (approving && raw.trim() === '')
        errors[`scores.${i}`] = 'Score this criterion before you approve.';
    });
    if (this.comment().length > 2000) errors['comment'] = 'Keep the comment to 2,000 characters.';
    this.errors.set(errors);
    return Object.keys(errors).length === 0;
  }

  private request(s: SubmissionReview, decision: GradeRequest['decision']): GradeRequest {
    return {
      decision,
      scores: s.rubric
        .map((c, i) => ({ criterionId: c.id, points: this.whole(this.scores()[i] ?? '') }))
        .filter((x): x is { criterionId: string; points: number } => x.points !== null),
      comment: this.comment().trim() || null,
      version: s.version,
    };
  }

  private dialogData(s: SubmissionReview, decision: GradeRequest['decision']): GradeDialogData {
    return {
      submissionId: s.id,
      request: this.request(s, decision),
      youthFirstName: firstName(s.youthName),
      assignmentTitle: s.assignmentTitle,
      total: this.total(),
      totalPoints: s.totalPoints,
    };
  }

  /** Saves a draft grade; true when saved. */
  private send(s: SubmissionReview, decision: 'draft'): Observable<boolean> {
    this.busy.set(true);
    this.failed.set(false);
    return this.api.grade(s.id, this.request(s, decision)).pipe(
      map((outcome) => {
        this.busy.set(false);
        this.settle(outcome, decision, s);
        return outcome.status === 'saved';
      }),
    );
  }

  private settle(
    outcome: GradeOutcome,
    decision: GradeRequest['decision'],
    s: SubmissionReview,
  ): void {
    switch (outcome.status) {
      case 'saved':
        this.saved.set({ scores: [...this.scores()], comment: this.comment() });
        if (decision === 'draft')
          this.toasts.show({
            tone: 'success',
            title: 'Draft saved',
            text: `${firstName(s.youthName)} still sees In review.`,
          });
        else
          this.toasts.show({
            tone: 'success',
            title: decision === 'approve' ? 'Approved' : 'Revision requested',
            text: `${s.assignmentTitle} · ${s.youthName}`,
          });
        this.refresh$.next();
        return;
      case 'invalid':
        this.errors.set(outcome.errors);
        return;
      case 'stale':
        this.conflict.set(true);
        return;
      case 'not-reviewable':
        this.refresh$.next();
        return;
      default:
        this.failed.set(true);
    }
  }

  private whole(raw: string): number | null {
    const t = raw.trim();
    return t !== '' && /^\d+$/.test(t) ? Number(t) : null;
  }

  private fieldId(key: string): string {
    const m = /^scores\.(\d+)$/.exec(key);
    return m ? `score-${Number(m[1]) + 1}` : key;
  }
}
