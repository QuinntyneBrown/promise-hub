import type { GatedResult } from './gated-result';
import type { Reflection } from './reflection';

/** Saving a reflection: saved, refused field by field (422), or locked, not found or failed. */
export type ReflectionSaveResult =
  GatedResult<Reflection> | { status: 'invalid'; errors: Record<string, string> };
