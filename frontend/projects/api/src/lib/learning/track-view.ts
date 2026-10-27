import type { ModuleItem } from './module-item';
import type { TrackRef } from './track-ref';

/** A track as a youth sees it (L2-068 criterion 2), with all their tracks for the switch. */
export interface TrackView {
  id: string;
  name: string;
  description: string | null;
  completedLessons: number;
  totalLessons: number;
  tracks: TrackRef[];
  modules: ModuleItem[];
}
