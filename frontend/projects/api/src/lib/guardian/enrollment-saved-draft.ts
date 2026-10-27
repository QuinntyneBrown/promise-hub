import type { EnrollmentDraft } from './enrollment-draft';

/** The draft to continue, with whether the family is returning, its language and the contact that was verified. */
export type EnrollmentSavedDraft = EnrollmentDraft & {
  returning: boolean;
  language: 'en' | 'es' | 'fr';
  program: string;
  contact: string;
};
