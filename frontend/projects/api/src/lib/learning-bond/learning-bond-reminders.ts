import type { LearningBondDateReminder } from './learning-bond-date-reminder';

/** learning-bond-reminders (L2-157): the reminders still ahead. */
export interface LearningBondReminders {
  language: 'en' | 'es' | 'fr';
  organization: string;
  reminders: LearningBondDateReminder[];
}
