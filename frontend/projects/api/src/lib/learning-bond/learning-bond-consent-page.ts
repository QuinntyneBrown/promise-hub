import type { LearningBondConsentChild } from './learning-bond-consent-child';

/** GET /g/learning-bond/{token}/consent: the agent's line and each child still to consent for (learning-bond-consent). */
export interface LearningBondConsentPage {
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  wordingVersion: number;
  children: LearningBondConsentChild[];
}
