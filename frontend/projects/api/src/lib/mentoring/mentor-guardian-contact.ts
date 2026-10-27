/** How a mentor reaches one of a youth’s guardians. */
export interface MentorGuardianContact {
  name: string;
  relationship: string;
  mobile: string | null;
  email: string | null;
  isPrimary: boolean;
}
