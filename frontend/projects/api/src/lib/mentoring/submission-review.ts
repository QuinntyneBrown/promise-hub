import type { SubmissionHistoryItem } from '../learning/submission-history-item';
import type { SubmittedFile } from '../learning/submitted-file';
import type { RubricScore } from './rubric-score';

/** A submission as its mentor grades it (L2-080 criterion 2), with the version a grade is checked against (L2-083). */
export interface SubmissionReview {
  id: string;
  membershipId: string;
  youthName: string;
  assignmentId: string;
  assignmentTitle: string;
  moduleTitle: string;
  brief: string | null;
  status: 'Submitted' | 'InReview' | 'NeedsRevision' | 'Accepted';
  late: boolean;
  round: number;
  submittedAt: string;
  text: string | null;
  link: string | null;
  file: SubmittedFile | null;
  rubric: RubricScore[];
  totalPoints: number;
  comment: string | null;
  feedback: string | null;
  points: number | null;
  history: SubmissionHistoryItem[];
  version: number;
}
