import type { LearningBondApplicationFields } from './learning-bond-application-fields';
import type { LearningBondDocumentRequest } from './learning-bond-document-request';

/** learning-bond-submitted (L2-150): where it went and when, the fields as sent, the estimate, the steps done and the deposit window. */
export interface LearningBondProgress {
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  applicationId: string;
  childId: string;
  firstName: string;
  provider: string;
  status: 'Submitted' | 'Received' | 'Deposited';
  submittedAt: string;
  estimate: number | null;
  depositAmount: number | null;
  stepsDone: number;
  expectedFrom: string;
  expectedTo: string;
  fields: LearningBondApplicationFields;
  document: LearningBondDocumentRequest | null;
}
