import type { Role } from '../session/role';

/**
 * One account's record (L2-113). `mentoring` is absent while Mentoring is off; `learning` while Learning is off or for anyone
 * who is not a youth.
 */
export interface PersonRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Deactivated';
  deactivatedAt: string | null;
  deactivatedBy: string | null;
  lastSignedInAt: string | null;
  isYou: boolean;
  child: {
    id: string;
    name: string;
    age: number | null;
    household: string;
    householdId: string;
    deleted: boolean;
  } | null;
  programs: string[];
  history: { at: string; action: string; summary: string; by: string }[];
  mentoring?: { mentor: string | null; youth: string[] };
  learning?: { lessonsDone: number; lessonsTotal: number; badges: string[] };
}
