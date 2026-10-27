import type { CodingSaved } from './coding-saved';
import type { GatedResult } from './gated-result';

/** Saving coding progress: saved, refused field by field (422), or locked, not found or failed. */
export type CodingSaveResult =
  GatedResult<CodingSaved> | { status: 'invalid'; errors: Record<string, string> };
