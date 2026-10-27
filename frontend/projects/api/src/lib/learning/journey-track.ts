import type { ModuleItem } from './module-item';

/** One followed track on the journey's roadmap, with its published modules in order. */
export interface JourneyTrack {
  id: string;
  name: string;
  completedLessons: number;
  totalLessons: number;
  modules: ModuleItem[];
}
