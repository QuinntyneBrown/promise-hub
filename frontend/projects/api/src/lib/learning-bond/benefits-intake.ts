import type { BenefitsIntakeChild } from './benefits-intake-child';

/** learning-bond-benefits-intake (L2-154): what is reused and the answers so far. */
export interface BenefitsIntake {
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  children: BenefitsIntakeChild[];
  sinGiven: boolean;
  taxAnswered: boolean;
  householdSize: number | null;
  maritalStatus: string | null;
  ccbNow: string | null;
  incomeChanged: string | null;
}
