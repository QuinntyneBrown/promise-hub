/** One rubric criterion with its points and the score the mentor saved for it, if any (L2-080 criterion 2). */
export interface RubricScore {
  id: string;
  description: string;
  points: number;
  score: number | null;
}
