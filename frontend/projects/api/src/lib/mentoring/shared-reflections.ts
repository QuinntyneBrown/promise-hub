import type { SharedReflection } from './shared-reflection';

/** The reflections a youth shared, newest first (L2-089 criterion 5). */
export interface SharedReflections {
  childId: string;
  name: string;
  reflections: SharedReflection[];
}
