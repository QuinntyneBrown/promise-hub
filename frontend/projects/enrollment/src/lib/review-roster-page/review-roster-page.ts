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
  ENROLLMENT_API,
  EnrollmentRequest,
  PROGRAMS_API,
  Program,
  ReviewDecision,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  PhBreadcrumb,
  PhBulkActionBar,
  PhButton,
  PhCard,
  PhCheckbox,
  PhDialogs,
  PhEmptyState,
  PhErrorPage,
  PhList,
  PhListItem,
  PhPageHeader,
  PhTabs,
  TabItem,
  ToastService,
  formatDate,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { BulkReviewData, BulkReviewDialog } from '../bulk-review-dialog/bulk-review-dialog';
import {
  ReviewEnrollmentData,
  ReviewEnrollmentDialog,
} from '../review-enrollment-dialog/review-enrollment-dialog';

type Section = 'review' | 'enrolled' | 'waitlist';

/** A program's roster (mock: roster): children waiting review with accept and waitlist, the enrolled, and the waitlist; bulk review (L2-013 criterion 4). */
@Component({
  selector: 'ph-review-roster-page',
  imports: [
    FormsModule,
    PhBreadcrumb,
    PhBulkActionBar,
    PhButton,
    PhCard,
    PhCheckbox,
    PhEmptyState,
    PhErrorPage,
    PhList,
    PhListItem,
    PhPageHeader,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-roster-page.html',
})
export class ReviewRosterPage {
  private readonly programs = inject(PROGRAMS_API);
  private readonly api = inject(ENROLLMENT_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  readonly programId = input.required<string>();

  protected readonly program = signal<Program | null>(null);
  protected readonly waiting = signal<EnrollmentRequest[]>([]);
  protected readonly waitlist = signal<EnrollmentRequest[]>([]);
  protected readonly state = signal<'loading' | 'loaded' | 'not-found' | 'error'>('loading');
  protected readonly section = signal<Section>('review');
  protected readonly selected = signal<Set<string>>(new Set());

  protected readonly allowed = computed(
    () => !this.me() || can(this.me()!.role, 'reviewEnrollments'),
  );
  protected readonly tabs = computed<TabItem[]>(() => [
    { value: 'review', label: 'Waiting review', count: this.waiting().length },
    { value: 'enrolled', label: 'Enrolled', count: this.program()?.enrolled ?? 0 },
    { value: 'waitlist', label: 'Waitlist', count: this.waitlist().length },
  ]);
  protected readonly chosen = computed(() =>
    this.waiting().filter((r) => this.selected().has(r.id)),
  );

  constructor() {
    effect(() => {
      if (this.allowed()) this.load(this.programId());
    });
  }

  protected load(programId: string): void {
    this.programs.get(programId).subscribe((p) => {
      if (p.status !== 'loaded')
        return this.state.set(p.status === 'not-found' ? 'not-found' : 'error');
      this.program.set(p.value);
      this.api.requests(programId, 'WaitingReview').subscribe((r) => {
        this.waiting.set(r.status === 'loaded' ? r.value.requests : []);
        this.selected.set(new Set());
        this.state.set(r.status === 'loaded' ? 'loaded' : 'error');
      });
      this.api
        .requests(programId, 'Waitlisted')
        .subscribe((r) => this.waitlist.set(r.status === 'loaded' ? r.value.requests : []));
    });
  }

  protected subtitle(p: Program): string {
    return `${p.enrolled} enrolled · ${this.waiting().length} waiting review · ${this.waitlist().length} waitlisted · ${p.capacity} places`;
  }

  protected meta(r: EnrollmentRequest): string {
    return [
      r.age !== null ? `${r.age}` : null,
      r.guardian,
      `applied ${formatDate(r.submittedAt)}`,
      r.returning ? 'returning' : 'new',
      r.medical ? null : 'no medical notes',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected toggle(id: string, on: boolean): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  protected review(r: EnrollmentRequest, decision: ReviewDecision): void {
    const p = this.program();
    if (!p) return;
    this.dialogs
      .open<ReviewDecision, ReviewEnrollmentData, ReviewEnrollmentDialog>(ReviewEnrollmentDialog, {
        request: r,
        decision,
        program: p.name,
        places: `${p.enrolled} of ${p.capacity} places taken`,
      })
      .closed.subscribe((done) => {
        if (!done) return;
        const word =
          done === 'Accept' ? 'accepted' : done === 'Waitlist' ? 'waitlisted' : 'declined';
        this.toasts.show({
          tone: 'success',
          title: `${r.child} ${word}`,
          text: `${r.guardian} is texted.`,
        });
        this.load(this.programId());
      });
  }

  protected bulk(decision: 'Accept' | 'Waitlist'): void {
    const requests = this.chosen();
    this.dialogs
      .open<boolean, BulkReviewData, BulkReviewDialog>(BulkReviewDialog, { requests, decision })
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({
          tone: 'success',
          title: `${requests.length} ${decision === 'Accept' ? 'accepted' : 'waitlisted'}`,
          text: 'Every guardian is texted.',
        });
        this.load(this.programId());
      });
  }
}
