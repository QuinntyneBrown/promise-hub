import type { ContentStatus } from '@promisehub/api';

/** "In review" for InReview; the other statuses read as they are named. */
export function statusLabel(status: ContentStatus): string {
  return status === 'InReview' ? 'In review' : status;
}

/** The badge tone of a status: published reads as success, in review as info, a draft as neutral. */
export function statusTone(status: ContentStatus): 'success' | 'info' | 'neutral' {
  return status === 'Published' ? 'success' : status === 'InReview' ? 'info' : 'neutral';
}
