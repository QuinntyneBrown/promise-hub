import type { Invitation } from './invitation';

/** The invitation, or gone with why (expired, withdrawn or used) and who to ask, or an error. */
export type InvitationResult =
  | { status: 'open'; invitation: Invitation }
  | {
      status: 'gone';
      reason: 'expired' | 'withdrawn' | 'used';
      invitedBy: string | null;
      organization: string | null;
    }
  | { status: 'error' };
