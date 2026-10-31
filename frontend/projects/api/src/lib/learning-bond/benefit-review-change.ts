import type { BenefitReview } from './benefit-review';

/** What an edit to a benefit application answered: the review as it now stands, the field's error, or a failure. */
export type BenefitReviewChange =
  | { status: 'saved'; value: BenefitReview }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'error' };
