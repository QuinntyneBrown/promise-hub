import type { SubmissionReview } from '@promisehub/api';
import type { PhBadge } from '@promisehub/components';

/** A submission's status as the mentor reads it, in words and a badge tone. */
export const REVIEW_LABEL: Record<SubmissionReview['status'], string> = {
  Submitted: 'Submitted',
  InReview: 'In review',
  NeedsRevision: 'Needs revision',
  Accepted: 'Accepted',
};

export const REVIEW_TONE: Record<SubmissionReview['status'], ReturnType<PhBadge['tone']>> = {
  Submitted: 'info',
  InReview: 'info',
  NeedsRevision: 'warning',
  Accepted: 'success',
};

/** The first word of a name: “Sofía” of “Sofía Rivera”. */
export function firstName(name: string): string {
  return name.split(' ')[0] ?? name;
}
