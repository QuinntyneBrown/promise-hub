/** Who accepted which version of the agreement for the organization, and when (L2-136 criterion 2). */
export interface LearningBondAcceptance {
  version: number;
  acceptedBy: string;
  acceptedAt: string;
}
