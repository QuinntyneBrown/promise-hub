import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ConsentRequestOutcome,
  LEARNING_API,
  LessonsResult,
  OnboardingResult,
} from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
} from '@promisehub/components';
import { Router } from '@angular/router';
import { Subject, startWith, switchMap } from 'rxjs';

/**
 * Learning, the youth’s lessons (mock: learning). Until a track is published it explains what will appear. A youth under the
 * consent age without consent sees the consent-required state (mock: consent-required) because the server refuses the
 * lessons, and can ask a guardian (L2-056).
 */
@Component({
  selector: 'ph-learning-page',
  imports: [PhAlert, PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-page.html',
})
export class LearningPage {
  private readonly api = inject(LEARNING_API);
  private readonly router = inject(Router);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.lessons().pipe(startWith<LessonsResult | null>(null))),
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

  /** The step an unfinished setup stopped at, or null. */
  protected resumeStep(): number | null {
    const s = this.setup();
    return s?.status === 'loaded' && s.value.status === 'in-progress' ? s.value.step : null;
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
