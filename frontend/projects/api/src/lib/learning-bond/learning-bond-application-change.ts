import type { LearningBondApplication } from './learning-bond-application';

/** What an edit to the application answered: the review as it now stands, the field's error, or a failure. */
export type LearningBondApplicationChange =
  | { status: 'saved'; value: LearningBondApplication }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'error' };
