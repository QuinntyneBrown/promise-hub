import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Learner } from './learner';
import type { LearningHomeResult } from './learning-home-result';
import type { GatedResult } from './gated-result';
import type { TrackView } from './track-view';
import type { ModuleView } from './module-view';
import type { LessonView } from './lesson-view';
import type { LessonCompletion } from './lesson-completion';
import type { CodingView } from './coding-view';
import type { CodingAnswers } from './coding-answers';
import type { CodingSaveResult } from './coding-save-result';
import type { ProjectSubmission } from './project-submission';
import type { ConsentRequestOutcome } from '../consent/consent-request-outcome';
import type { WriteOutcome } from '../write-outcome';
import type { OnboardingAnswers } from './onboarding-answers';
import type { OnboardingResult } from './onboarding-result';
import type { QuizIntro } from './quiz-intro';
import type { StartQuizResult } from './start-quiz-result';
import type { QuizAnswer } from './quiz-answer';
import type { AnswersOutcome } from './answers-outcome';
import type { QuizResult } from './quiz-result';

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
  /** Where a lesson's video streams from, for the video player (ADR 0051). */
  lessonVideoUrl(id: string): string;
  /** A coding lesson or project with the youth's saved code and ticks (L2-070). */
  coding(id: string): Observable<GatedResult<CodingView>>;
  /** Saves code and ticks; ticking every step completes a coding lesson. */
  saveCoding(id: string, answers: CodingAnswers): Observable<CodingSaveResult>;
  /** Submits a coding project to the youth's mentor, once (L2-070 criterion 4). */
  submitProject(id: string, submission: ProjectSubmission): Observable<WriteOutcome>;
  /** A quiz's rules and the youth's attempts; locked until its lessons are done (L2-075 criteria 1 and 2). */
  quiz(id: string): Observable<GatedResult<QuizIntro>>;
  /** Starts the next attempt or resumes the one in progress (L2-075 criterion 3). */
  startQuiz(quizId: string): Observable<StartQuizResult>;
  /** Saves every answer so far and the question she is on (L2-075 criterion 4). */
  saveAnswers(
    attemptId: string,
    answers: QuizAnswer[],
    position: number,
  ): Observable<AnswersOutcome>;
  /** Saves her final answers, scores the attempt on the server and locks it (L2-075 criterion 5). */
  submitQuiz(
    attemptId: string,
    answers: QuizAnswer[],
    position: number,
  ): Observable<AnswersOutcome>;
  /** A submitted attempt's score, pass and review as the quiz's feedback rule allows (L2-076). */
  attempt(id: string): Observable<GatedResult<QuizResult>>;
  /** Asks the guardians of the youth's household for consent. */
  askGuardian(): Observable<ConsentRequestOutcome>;
  /** The youth's first-run setup with its defaults and their program (L2-059). */
  onboarding(): Observable<OnboardingResult>;
  /** Saves one step of the setup. */
  saveOnboarding(answers: OnboardingAnswers): Observable<WriteOutcome>;
  /** Finishes the setup; audited on the server. */
  completeOnboarding(): Observable<WriteOutcome>;
}
