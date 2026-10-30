/** POST /sign/learning-bond/{token}/acceptances: what was recorded for the signer (L2-137 criterion 2). */
export interface LearningBondSignerAcceptance {
  organization: string;
  requestedBy: string;
  name: string;
  title: string;
  email: string;
  version: number;
  /** ISO 8601. */
  acceptedAt: string;
}
