import type { LearningBondAcceptance } from './learning-bond-acceptance';
import type { LearningBondAgreementSection } from './learning-bond-agreement-section';
import type { LearningBondSignerRequest } from './learning-bond-signer-request';

/** GET /learning-bond/agreement: the current version and where the organization stands with it (L2-136, L2-137). */
export interface LearningBondAgreement {
  version: number;
  /** yyyy-mm-dd. */
  effectiveOn: string;
  sections: LearningBondAgreementSection[];
  /** The organization's acceptance of this version, if any. */
  acceptance: LearningBondAcceptance | null;
  /** While a new version is pending: the organization's latest acceptance of an earlier one. */
  earlierAcceptance: LearningBondAcceptance | null;
  /** The open request for a named signer, if any. */
  signer: LearningBondSignerRequest | null;
  /** Whether Learning Bond is on: the agreement is served while it is off (ADR 0077). */
  moduleOn: boolean;
}
