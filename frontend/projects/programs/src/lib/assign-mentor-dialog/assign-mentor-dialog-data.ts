import type { MentorOption, Program, YouthMentorRow } from '@promisehub/api';

/** What the assign-mentor dialog needs: the cohort, the youth and the mentors to choose from. */
export interface AssignMentorDialogData {
  program: Program;
  youth: YouthMentorRow;
  mentors: MentorOption[];
}
