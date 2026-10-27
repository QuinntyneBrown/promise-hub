import type { ContentStatus } from './content-status';

/** An assignment in the module editor; lessonTitle is null for the whole module. */
export interface AssignmentSummary {
  id: string;
  title: string;
  lessonTitle: string | null;
  status: ContentStatus;
  totalPoints: number;
}
