/** A child's guardian consent on the child record (L2-058 criterion 3). */
export interface ChildConsent {
  required: boolean;
  consentAge: number;
  status: 'Needed' | 'Given' | 'Withdrawn';
  signedBy: string | null;
  relationship: string | null;
  signedAt: string | null;
  reference: string | null;
  withdrawnAt: string | null;
  withdrawnBy: string | null;
  linkSentAt: string | null;
}
