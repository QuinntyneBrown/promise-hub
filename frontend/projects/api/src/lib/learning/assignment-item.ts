/** An assignment on a module page (L2-077 criterion 1): her status, its points and due date, and what to finish while locked. */
export interface AssignmentItem {
  id: string;
  title: string;
  lessonId: string | null;
  totalPoints: number;
  /** yyyy-mm-dd, or null without a due date. */
  dueDate: string | null;
  status: 'locked' | 'next' | 'submitted' | 'in-review' | 'needs-revision' | 'accepted';
  unlockAfter: string | null;
  submissionId: string | null;
}
