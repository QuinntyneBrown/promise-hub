import type { Reflection } from './reflection';

/** The reflection page: the lesson, its prompts, her mentor's name and her saved reflection or null (L2-089 criterion 1). */
export interface ReflectionEditor {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleTitle: string;
  prompts: string[];
  mentorName: string | null;
  reflection: Reflection | null;
}
