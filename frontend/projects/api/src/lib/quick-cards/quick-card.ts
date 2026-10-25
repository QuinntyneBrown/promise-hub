export interface QuickCard {
  id: string;
  householdId: string;
  name: string;
  age: number | null;
  school: string | null;
  programs: string[];
  primaryGuardian: string | null;
  language: string;
  /** Null when there is no red-alert allergy or the role cannot read medical details. */
  allergyAlert: { title: string; instruction: string | null } | null;
  /** Null when nothing medical is recorded or the role cannot read it. */
  medical: {
    allergies: string | null;
    medication: string | null;
    conditions: string | null;
    doctor: string | null;
    healthCard: string | null;
  } | null;
  callOrder: {
    name: string;
    relationship: string;
    phone: string;
    language: string;
    isPrimary: boolean;
  }[];
  /** Guardians who may pick up, then other approved adults (with their pickupId). */
  approvedPickups: {
    name: string;
    relationship: string;
    isPrimary: boolean;
    pickupId?: string | null;
  }[];
  notes: string | null;
  medicalRestricted: boolean;
  /** Set when the card came from this device without signal: when it was saved. */
  savedAt?: string;
}
