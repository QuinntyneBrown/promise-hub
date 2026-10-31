/** learning-bond-paused (L2-151): why the claim waits, what helps, where it resumes, and the reminder choice with its dates. */
export interface LearningBondPaused {
  language: 'en' | 'es' | 'fr';
  organization: string;
  explanation: string;
  childId: string;
  firstName: string;
  status: 'Paused';
  reason: 'NeedsSin' | 'NeedsTaxReturn' | 'AwaitingRecordFix';
  helpLink: string | null;
  resumeStep: 'intake' | 'estimate';
  reminder: boolean | null;
  reminderDates: string[];
}
