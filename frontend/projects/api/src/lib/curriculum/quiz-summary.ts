import type { ContentStatus } from './content-status';

/** A quiz in the module editor; lessonTitle is null for the whole module. */
export interface QuizSummary {
  id: string;
  title: string;
  lessonTitle: string | null;
  status: ContentStatus;
  questionCount: number;
}
