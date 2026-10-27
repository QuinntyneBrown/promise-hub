/** One of the youth's tracks, with the program that follows it. */
export interface TrackSummary {
  id: string;
  name: string;
  description: string | null;
  program: string;
  completedLessons: number;
  totalLessons: number;
}
