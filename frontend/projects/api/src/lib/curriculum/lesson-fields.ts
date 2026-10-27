/** The lesson editor's content form; objectives and prompts are one per line. */
export interface LessonFields {
  title: string;
  reading: string;
  minutes: number | null;
  objectives: string[];
  body: string;
  prompts: string[];
  leaderNotes: string;
}
