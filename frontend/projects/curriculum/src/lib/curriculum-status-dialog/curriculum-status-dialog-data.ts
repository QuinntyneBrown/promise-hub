import type { ContentStatus } from '@promisehub/api';

/** What the status dialog changes: a track or lesson (Draft or Published) or a module (also In review). */
export interface CurriculumStatusDialogData {
  kind: 'track' | 'module' | 'lesson';
  id: string;
  name: string;
  status: ContentStatus;
  /** Who will see it once published, in one sentence. */
  audience: string;
}
