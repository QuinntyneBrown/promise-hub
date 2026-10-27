/** One competency of the framework with its stage and her latest assessed level. */
export interface CompetencyLevelItem {
  id: string;
  name: string;
  stage: string | null;
  level: 'NotStarted' | 'Developing' | 'Proficient' | 'Mastered';
}
