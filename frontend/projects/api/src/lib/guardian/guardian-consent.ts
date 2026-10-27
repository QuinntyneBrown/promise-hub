/** The guardian consent page (L2-055, L2-058): the child, the organization's wording and what is on record. */
export interface GuardianConsent {
  language: 'en' | 'es' | 'fr';
  organization: string;
  phone: string | null;
  guardianName: string;
  child: { name: string; firstName: string; age: number };
  wording: string;
  consentAge: number;
  status: 'Needed' | 'Given' | 'Withdrawn';
  signedBy: string | null;
  relationship: string | null;
  signedAt: string | null;
  reference: string | null;
  withdrawnAt: string | null;
  withdrawnBy: string | null;
}
