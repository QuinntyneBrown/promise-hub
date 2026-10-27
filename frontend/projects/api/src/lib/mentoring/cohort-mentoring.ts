import type { MentorOption } from './mentor-option';
import type { YouthMentorRow } from './youth-mentor-row';

/** A cohort's mentor team, each roster child's mentor and the mentors that can be chosen (L2-062). */
export interface CohortMentoring {
  programId: string;
  lead: MentorOption | null;
  supporting: MentorOption[];
  youth: YouthMentorRow[];
  mentors: MentorOption[];
}
