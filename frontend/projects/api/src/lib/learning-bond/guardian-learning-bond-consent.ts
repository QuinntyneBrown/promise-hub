/** A child's Learning Bond consent in force, under Your consents (L2-152): who signed, when, and the provider anything went to. */
export interface GuardianLearningBondConsent {
  id: string;
  childId: string;
  firstName: string;
  typedName: string;
  givenAt: string;
  wordingVersion: number;
  provider: string | null;
  sent: boolean;
}
