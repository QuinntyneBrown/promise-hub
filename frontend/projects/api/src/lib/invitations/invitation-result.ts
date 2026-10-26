import type { Invitation } from './invitation';

/** The invitation, or gone (expired, withdrawn or used) with who to ask, or an error. */
export type InvitationResult =
  | { status: 'open'; invitation: Invitation }
  | { status: 'gone'; invitedBy: string | null; organization: string | null }
  | { status: 'error' };
