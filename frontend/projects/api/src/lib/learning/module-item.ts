/** A module in a track; `unlockAfter` names its prerequisite while locked. */
export interface ModuleItem {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
  completedLessons: number;
  status: 'done' | 'in-progress' | 'not-started' | 'locked';
  unlockAfter: string | null;
}
