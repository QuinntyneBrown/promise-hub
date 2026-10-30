/** One benefit (L2-155, L2-156): exactly one state, the yearly amount (null when it varies) and its source. */
export interface BenefitItem {
  key: string;
  name: string;
  level: 'Federal' | 'Provincial' | 'Municipal';
  amount: number | null;
  state: 'ApplyNow' | 'NeedDocument' | 'NotEligible' | 'AlreadyGet' | 'Submitted';
  reason: string | null;
  document: string | null;
  documentFile: string | null;
  channel: 'Electronic' | 'Form';
  source: string;
  sourceLink: string;
  ruleVersion: string;
  applicationId: string | null;
}
