import type { GuardianLearningBondChild } from './guardian-learning-bond-child';

/** GET /g/learning-bond/{token}/page: the guardian's page for a verified device (L2-144). */
export interface GuardianLearningBond {
  language: 'en' | 'es' | 'fr';
  organization: string;
  phone: string | null;
  /** The agent's approved line for the step (L2-160). */
  explanation: string;
  children: GuardianLearningBondChild[];
  status: string;
}
