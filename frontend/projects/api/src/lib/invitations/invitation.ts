import type { Role } from '../session/role';

/** An invitation as the accept page shows it, for any role (ADR 0045). */
export interface Invitation {
  email: string;
  organization: string;
  role: Role;
  invitedBy: string;
  /** For a youth invitation, the child's name to offer as theirs. */
  suggestedName?: string | null;
}
