import type { CohortMentoring, Program } from '@promisehub/api';

/** What the cohort-mentors dialog needs: the cohort and its current mentoring. */
export interface CohortMentorsDialogData {
  program: Program;
  mentoring: CohortMentoring;
}
