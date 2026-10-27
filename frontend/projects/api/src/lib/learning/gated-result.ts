import type { LoadResult } from '../load-result';

/** A youth read: the value, why there is none, or locked with what to finish first (403 locked, ADR 0051). */
export type GatedResult<T> = LoadResult<T> | { status: 'locked'; unlockAfter: string | null };
