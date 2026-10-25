import type { GuardianPageResult } from './guardian-page-result';
import type { GuardianSlip } from './guardian-slip';

/** The slip, or why it can't show yet. */
export type GuardianSlipResult = GuardianPageResult<GuardianSlip>;
