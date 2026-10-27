/** A reflection a youth shared with her mentor (L2-089 criterion 5). */
export interface SharedReflection {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  mood: 'Hopeful' | 'Thoughtful' | 'Unsure' | 'Challenged';
  text: string;
  action: string | null;
  savedAt: string;
}
