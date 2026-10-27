/** One stage of the progression framework as the youth stands with it (L2-087 criterion 3, ADR 0059). */
export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  status: 'earned' | 'current' | 'ahead';
  /** Its competencies at Proficient or Mastered. */
  proficient: number;
  competencies: string[];
}
