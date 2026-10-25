import type { AttendanceStatus } from './attendance-status';

export interface RosterEntry {
  /** The child's id, or the walk-in's. */
  id: string;
  childId: string | null;
  householdId: string | null;
  name: string;
  age: number | null;
  school: string | null;
  /** Null for roles without medical access. */
  medicalFlag: string | null;
  status: AttendanceStatus;
  checkedInAt: string | null;
  walkIn: boolean;
  signedOutAt: string | null;
  /** Who collected the child at sign-out. */
  collectedBy: string | null;
}
