import type { Medical } from './medical';

export interface Child {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  age: number | null;
  school: string | null;
  householdId: string;
  householdName: string;
  /** Null, with medicalRestricted true, when the role cannot read medical details. */
  medical: Medical | null;
  medicalRestricted: boolean;
}
