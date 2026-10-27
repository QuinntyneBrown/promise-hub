import type { GatedResult } from './gated-result';
import type { QuizAttemptView } from './quiz-attempt-view';

/** Starting or resuming an attempt: the attempt, or no attempts left (409 no-attempts), or why not. */
export type StartQuizResult = GatedResult<QuizAttemptView> | { status: 'no-attempts' };
