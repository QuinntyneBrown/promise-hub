import type { WriteOutcome } from '../write-outcome';
import type { AssignedWorkResult } from './assigned-work-result';

/** Assigning work: assigned with what the server saved, or why not (L2-092 criteria 2 and 3). */
export type AssignWorkOutcome =
  { status: 'assigned'; result: AssignedWorkResult } | Exclude<WriteOutcome, { status: 'saved' }>;
