import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Learner } from './learner';
import type { LearningHomeResult } from './learning-home-result';
import type { GatedResult } from './gated-result';
import type { TrackView } from './track-view';
import type { ModuleView } from './module-view';
import type { LessonView } from './lesson-view';
import type { LessonCompletion } from './lesson-completion';
import type { ConsentRequestOutcome } from '../consent/consent-request-outcome';
import type { WriteOutcome } from '../write-outcome';
import type { OnboardingAnswers } from './onboarding-answers';
import type { OnboardingResult } from './onboarding-result';

/** The signed-in youth’s own learning record (Learning module, ADR 0043). */
export interface LearningApi {
  learner(): Observable<LoadResult<Learner>>;
  /** The Learning home; refused as consent-required until a guardian consents (L2-056) and no-cohort until placed (L2-060). */
  home(): Observable<LearningHomeResult>;
  /** One of the youth's tracks (L2-068). */
  track(id: string): Observable<GatedResult<TrackView>>;
  /** One module; locked until its prerequisite is done (L2-068 criterion 3). */
  module(id: string): Observable<GatedResult<ModuleView>>;
  /** One lesson; locked until the one before it is done (L2-069). */
  lesson(id: string): Observable<GatedResult<LessonView>>;
  /** Marks a reading or scripture lesson done (L2-069 criterion 4). */
  completeLesson(id: string): Observable<GatedResult<LessonCompletion>>;
  /** Asks the guardians of the youth's household for consent. */
  askGuardian(): Observable<ConsentRequestOutcome>;
  /** The youth's first-run setup with its defaults and their program (L2-059). */
  onboarding(): Observable<OnboardingResult>;
  /** Saves one step of the setup. */
  saveOnboarding(answers: OnboardingAnswers): Observable<WriteOutcome>;
  /** Finishes the setup; audited on the server. */
  completeOnboarding(): Observable<WriteOutcome>;
}
