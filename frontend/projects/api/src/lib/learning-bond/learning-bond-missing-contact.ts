/** A covered household with no mobile number or email to invite by (L2-140 criterion 1): never a contact. */
export interface LearningBondMissingContact {
  householdId: string;
  name: string;
  guardian: string | null;
  /** The covered programs, comma-separated. */
  programs: string;
}
