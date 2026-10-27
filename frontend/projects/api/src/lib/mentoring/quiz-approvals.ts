import type { QuizApprovalItem } from './quiz-approval-item';

/** The quiz results waiting for the mentor's approval, oldest first. */
export interface QuizApprovals {
  items: QuizApprovalItem[];
}
