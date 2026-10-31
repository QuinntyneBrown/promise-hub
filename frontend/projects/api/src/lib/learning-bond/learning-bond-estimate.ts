/** GET /g/learning-bond/{token}/children/{childId}/estimate (L2-147): one "up to" amount from the rule, and whether taxes must be filed first. */
export interface LearningBondEstimate {
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  childId: string;
  firstName: string;
  amount: number | null;
  ruleVersion: number;
  bornBefore2004: boolean;
  needsTaxReturn: boolean;
}
