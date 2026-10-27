import type { ContentStatus } from '@promisehub/api';

/** What the status dialog changes: a track, lesson, quiz or assignment (Draft or Published) or a module (also In review). */
export interface CurriculumStatusDialogData {
  kind: 'track' | 'module' | 'lesson' | 'quiz' | 'assignment';
  id: string;
  name: string;
  status: ContentStatus;
  /** Who will see it once published, in one sentence. */
  audience: string;
}
