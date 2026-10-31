import type { BenefitReviewFields } from './benefit-review-fields';

/** learning-bond-benefit-review (L2-156 criterion 2): one benefit's application and how it is sent. */
export interface BenefitReview {
  id: string;
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  benefitKey: string;
  program: string;
  channel: 'Electronic' | 'Form';
  status: 'Draft' | 'ReadyToSubmit' | 'Submitted' | 'MarkedSent';
  reviewVersion: number;
  amount: number | null;
  documentFile: string | null;
  sendTo: string | null;
  fields: BenefitReviewFields;
}
