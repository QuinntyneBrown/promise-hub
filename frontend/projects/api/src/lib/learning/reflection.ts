import type { ReflectionMood } from './reflection-mood';

/** Her saved reflection (L2-089 criterion 1). */
export interface Reflection {
  mood: ReflectionMood;
  text: string;
  action: string | null;
  shared: boolean;
  savedAt: string;
}
