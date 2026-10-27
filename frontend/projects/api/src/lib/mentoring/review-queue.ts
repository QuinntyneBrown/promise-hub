import type { ReviewItem } from './review-item';

/** The mentor's review queue, oldest first (L2-080 criterion 1). */
export interface ReviewQueue {
  items: ReviewItem[];
}
