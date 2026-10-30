import type { LearningBondSignerAcceptance } from './learning-bond-signer-acceptance';

/** Accepting as the named signer: recorded, refused without the authority box, or the link no longer works (L2-137 criteria 2, 8 and 9). */
export type LearningBondSignerOutcome =
  | { status: 'accepted'; value: LearningBondSignerAcceptance }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'expired'; organization: string }
  | { status: 'not-found' }
  | { status: 'error' };
