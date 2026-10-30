/** A running program and the households it would reach (L2-138 criterion 1): counts only. */
export interface LearningBondProgram {
  id: string;
  name: string;
  households: number;
}
