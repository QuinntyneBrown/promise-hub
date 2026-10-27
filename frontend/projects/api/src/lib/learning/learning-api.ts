import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Learner } from './learner';
import type { LessonsResult } from './lessons-result';
import type { ConsentRequestOutcome } from '../consent/consent-request-outcome';
import type { WriteOutcome } from '../write-outcome';
import type { OnboardingAnswers } from './onboarding-answers';
import type { OnboardingResult } from './onboarding-result';

/** The signed-in youth’s own learning record (Learning module, ADR 0043). */
export interface LearningApi {
  learner(): Observable<LoadResult<Learner>>;
  /** Youth work: refused as consent-required until a guardian consents (L2-056). */
  lessons(): Observable<LessonsResult>;
  /** Asks the guardians of the youth's household for consent. */
  askGuardian(): Observable<ConsentRequestOutcome>;
  /** The youth's first-run setup with its defaults and their program (L2-059). */
  onboarding(): Observable<OnboardingResult>;
  /** Saves one step of the setup. */
  saveOnboarding(answers: OnboardingAnswers): Observable<WriteOutcome>;
  /** Finishes the setup; audited on the server. */
  completeOnboarding(): Observable<WriteOutcome>;
}
