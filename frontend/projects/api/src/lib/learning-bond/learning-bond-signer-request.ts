import type { LearningBondSignerEmail } from './learning-bond-signer-email';

/** The open request for a named signer (L2-137): who was asked and when, and the email they received; never the token. */
export interface LearningBondSignerRequest {
  id: string;
  name: string;
  title: string;
  email: string;
  sentAt: string;
  expiresAt: string;
  preview: LearningBondSignerEmail;
}
