/** The progress board of one cohort (L2-131): module columns, a row per youth and the cohort average. */
export interface ProgressBoard {
  programId: string;
  programName: string;
  trackName: string | null;
  modules: { moduleId: string; title: string }[];
  youth: {
    childId: string;
    name: string;
    cells: ('Done' | 'InProgress' | 'NotStarted' | 'NoAccount')[];
    quizAverage: number | null;
    overall: number | null;
  }[];
  average: { modules: (number | null)[]; quizAverage: number | null; overall: number | null };
}
