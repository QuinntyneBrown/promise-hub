import type { SubmissionHistoryItem } from './submission-history-item';
import type { SubmissionRef } from './submission-ref';
import type { SubmittedFile } from './submitted-file';

/** The youth's own submission (L2-078 criteria 1 to 3): status, what she sent, the mentor's feedback and points, and its history. */
export interface AssignmentSubmissionView {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  moduleId: string;
  moduleTitle: string;
  status: SubmissionRef['status'];
  late: boolean;
  round: number;
  text: string | null;
  link: string | null;
  file: SubmittedFile | null;
  feedback: string | null;
  reviewerName: string | null;
  /** Her mentor, who reviews it next. */
  mentorName: string | null;
  points: number | null;
  totalPoints: number;
  submittedAt: string;
  history: SubmissionHistoryItem[];
}
