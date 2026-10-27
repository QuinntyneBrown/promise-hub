import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ConsentRequestOutcome,
  LEARNING_API,
  LearningHome,
  LearningHomeResult,
  OnboardingResult,
  TrackSummary,
} from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhProgressBar,
  PhSkeleton,
} from '@promisehub/components';
import { Router } from '@angular/router';
import { Subject, startWith, switchMap } from 'rxjs';
import { lessonLink } from '../lesson-link';

/**
 * Learning home (mock: learn-home, L2-068 criterion 1): where the youth left off, their progress and their tracks. A youth under
 * the consent age without consent sees the consent-required state because the server refuses (L2-056) and can ask a guardian; a
 * youth in no program sees the waiting state (L2-060); an unfinished setup offers to resume (L2-059).
 */
@Component({
  selector: 'ph-learning-page',
  imports: [
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhProgressBar,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-page.html',
  styleUrl: './learning-page.css',
})
export class LearningPage {
  private readonly api = inject(LEARNING_API);
  private readonly router = inject(Router);
  private readonly refresh$ = new Subject<void>();
  protected readonly lessonLink = lessonLink;

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.home().pipe(startWith<LearningHomeResult | null>(null))),
    ),
    { initialValue: null },
  );
  protected readonly asking = signal(false);
  /** The last answer to "Ask my guardian". */
  protected readonly asked = signal<ConsentRequestOutcome | null>(null);

  /** The youth's setup: never started opens it once; unfinished shows where to pick up (L2-059 criteria 1 and 4). */
  protected readonly setup = signal<OnboardingResult | null>(null);

  constructor() {
    this.api.onboarding().subscribe((setup) => {
      if (setup.status === 'loaded' && setup.value.status === 'not-started') {
        void this.router.navigateByUrl('/learning/welcome');
        return;
      }
      this.setup.set(setup);
    });
  }

  /** The name the youth goes by, once the setup has loaded. */
  protected name(): string | null {
    const s = this.setup();
    return s?.status === 'loaded' ? s.value.preferredName : null;
  }

  /** The step an unfinished setup stopped at, or null. */
  protected resumeStep(): number | null {
    const s = this.setup();
    return s?.status === 'loaded' && s.value.status === 'in-progress' ? s.value.step : null;
  }

  protected subtitle(home: LearningHome): string {
    const hello = this.name() ? `Hi, ${this.name()}. ` : '';
    if (!home.tracks.length) return 'Your lessons, quizzes, assignments and badges.';
    if (!home.next) return `${hello}You finished every lesson that’s out so far.`;
    return `${hello}You’re ${home.completedLessons} of ${home.totalLessons} lessons in.`;
  }

  protected trackMeta(t: TrackSummary): string {
    return `${t.completedLessons} of ${t.totalLessons} lessons · ${t.program}`;
  }

  protected trackStatus(t: TrackSummary): string {
    return t.totalLessons > 0 && t.completedLessons === t.totalLessons
      ? 'Done'
      : t.completedLessons > 0
        ? 'In progress'
        : 'Not started';
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected askGuardian(): void {
    this.asking.set(true);
    this.api.askGuardian().subscribe((outcome) => {
      this.asking.set(false);
      this.asked.set(outcome);
    });
  }
}
