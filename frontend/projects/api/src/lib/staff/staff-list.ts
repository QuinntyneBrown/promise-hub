import type { Role } from '../session/role';

/** The organization's staff with access and the invitations still waiting (page: staff). */
export interface StaffList {
  members: { id: string; name: string; email: string; role: Role; isYou: boolean }[];
  invitations: {
    id: string;
    email: string;
    role: Role;
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
  }[];
}
