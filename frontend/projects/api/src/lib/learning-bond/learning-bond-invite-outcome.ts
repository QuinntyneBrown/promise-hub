/** Inviting a household at the door: sent now, already invited within 7 days (with when), or why not (L2-140 criteria 4 and 5). */
export type LearningBondInviteOutcome =
  | { status: 'invited'; invitedAt: string }
  | { status: 'already'; invitedAt: string }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error' };
