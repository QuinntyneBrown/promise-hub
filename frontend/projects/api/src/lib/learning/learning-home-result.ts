import type { LoadResult } from '../load-result';
import type { LearningHome } from './learning-home';

/** The Learning home, or the consent gate (403 consent-required, L2-056), or the placement lock (403 no-cohort, L2-060), or why it couldn't load. */
export type LearningHomeResult =
  | LoadResult<LearningHome>
  | { status: 'consent-required'; consentAge: number }
  | { status: 'no-cohort' };
