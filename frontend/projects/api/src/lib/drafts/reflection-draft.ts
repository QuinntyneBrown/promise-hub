/** A reflection not yet saved, kept on this device (L2-079 criterion 5, ADR 0060). */
export interface ReflectionDraft {
  mood: string;
  text: string;
  action: string;
  shared: boolean;
  savedAt: string;
}
