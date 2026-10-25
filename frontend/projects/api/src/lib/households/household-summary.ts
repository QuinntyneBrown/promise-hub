export interface HouseholdSummary {
  id: string;
  name: string;
  primaryGuardian: string | null;
  /** "Mateo (9)" */
  children: string[];
  language: string;
  medicalFlags: number;
  missingInfo: boolean;
}
