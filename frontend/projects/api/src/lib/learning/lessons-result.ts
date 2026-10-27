import type { LoadResult } from '../load-result';
import type { Lessons } from './lessons';

/** The lessons, or the consent gate (403 consent-required, L2-056), or why they couldn't load. */
export type LessonsResult =
  LoadResult<Lessons> | { status: 'consent-required'; consentAge: number };
