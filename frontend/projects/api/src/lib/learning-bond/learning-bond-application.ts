import type { LearningBondApplicationFields } from './learning-bond-application-fields';

/** The review (learning-bond-review, L2-148): the provider and why, the providers serving the province, the version Submit quotes, the fields. */
export interface LearningBondApplication {
  id: string;
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  childId: string;
  firstName: string;
  status: 'Draft' | 'ReadyToSubmit' | 'Submitted' | 'Received' | 'Deposited' | 'Cancelled';
  reviewVersion: number;
  province: string;
  provider: string | null;
  reason: string;
  providers: string[];
  noProvider: boolean;
  fields: LearningBondApplicationFields;
}
