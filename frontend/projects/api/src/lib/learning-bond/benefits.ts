import type { BenefitItem } from './benefit-item';

/** learning-bond-benefits (L2-155, L2-156): each benefit, who the check stopped for, and the notes. */
export interface Benefits {
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  benefits: BenefitItem[];
  blocked: string[];
  incomeNote: string | null;
  localNote: string | null;
  allReceived: boolean;
}
