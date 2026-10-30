import type { LearningBondSignerAgreement } from './learning-bond-signer-agreement';

/**
 * The signer's link: the agreement, or why it can't be read. A used, expired, cancelled or replaced link, or one whose organization is
 * suspended, is expired and names the organization; a link PromiseHub doesn't know is not-found (L2-137 criterion 9).
 */
export type LearningBondSignerResult =
  | { status: 'loaded'; value: LearningBondSignerAgreement }
  | { status: 'expired'; organization: string }
  | { status: 'not-found' }
  | { status: 'error' };
