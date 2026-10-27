/** A reflection to save: a mood, her words, one thing she'll do and whether her mentor may read it. */
export interface SaveReflection {
  mood: string | null;
  text: string;
  action: string | null;
  shared: boolean;
}
