import type { Role } from '../session/role';

/** The organization's staff with access and the invitations waiting or expired (page: staff). */
export interface StaffList {
  members: { id: string; name: string; email: string; role: Role; isYou: boolean }[];
  invitations: {
    id: string;
    email: string;
    role: Role;
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
    /** Waiting, or expired unaccepted and still resendable (L2-052). */
    status: 'Pending' | 'Expired';
    /** For a youth invitation, the child the account links to. */
    childName: string | null;
    /** The invitee asked for a new link from the expired page (L2-054). */
    replacementRequested: boolean;
  }[];
}
