import type { LearningBondAgreementSection } from './learning-bond-agreement-section';

/** GET /sign/learning-bond/{token}: what the named signer reads, with no sign-in (L2-137 criterion 8, ADR 0078). Never the email or token. */
export interface LearningBondSignerAgreement {
  organization: string;
  /** The admin who named the signer. */
  requestedBy: string;
  name: string;
  title: string;
  version: number;
  /** yyyy-mm-dd. */
  effectiveOn: string;
  sections: LearningBondAgreementSection[];
}
