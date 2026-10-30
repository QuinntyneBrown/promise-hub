/** GET /g/learning-bond/{token}/children/{childId}/intake (L2-146): the record to confirm and what is answered; SINs as their last 3 digits. */
export interface LearningBondIntake {
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  childId: string;
  firstName: string;
  childName: string;
  /** yyyy-mm-dd. */
  dateOfBirth: string | null;
  taxYear: number;
  guardianSin: string | null;
  childSin: string | null;
  taxFiled: 'Yes' | 'No' | 'NotSure' | null;
  recordFixRequested: boolean;
}
