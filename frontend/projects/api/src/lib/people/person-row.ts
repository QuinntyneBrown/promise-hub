import type { Role } from '../session/role';

/** One account in the people directory (L2-112). `mentoring` is absent while Mentoring is off. */
export interface PersonRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'Active' | 'Deactivated';
  programs: string[];
  lastSignedInAt: string | null;
  isYou: boolean;
  mentoring?: { mentor: string | null; youth: string[] };
}
