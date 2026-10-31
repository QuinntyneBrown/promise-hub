/** The Benefits consent (L2-153 criterion 2): its own wording and version, and whether it is already given. */
export interface BenefitsConsent {
  language: 'en' | 'es' | 'fr';
  organization: string;
  wording: string;
  wordingVersion: number;
  given: boolean;
}
