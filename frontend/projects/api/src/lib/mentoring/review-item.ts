/** One piece of work waiting for the mentor (L2-080 criterion 1): a submission to grade, or a quiz result to approve with its auto-score. */
export interface ReviewItem {
  id: string;
  kind: 'Assignment' | 'Quiz';
  membershipId: string;
  youthName: string;
  title: string;
  moduleTitle: string;
  submittedAt: string;
  late: boolean;
  status: string;
  score: number | null;
}
