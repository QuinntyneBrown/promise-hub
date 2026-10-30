/** PUT /g/learning-bond/{token}/benefits/intake (L2-154). */
export interface SaveBenefitsIntake {
  householdSize: number | null;
  maritalStatus: string | null;
  ccbNow: string | null;
  incomeChanged: string | null;
  custody: Record<string, string>;
}
