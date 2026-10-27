/**
 * A grade's outcome (L2-080, L2-083): saved with the new status, points and version; invalid with one message per field; stale when the
 * submission changed since it was read; not reviewable once graded; or why it failed.
 */
export type GradeOutcome =
  | { status: 'saved'; submissionStatus: string; points: number | null; version: number }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'stale' }
  | { status: 'not-reviewable' }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error' };
