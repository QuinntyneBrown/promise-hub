import type { Role } from '../session/role';

/** A staff invitation as the accept page shows it. */
export interface Invitation {
  email: string;
  organization: string;
  role: Role;
  invitedBy: string;
}
