import type { MentorOption } from './mentor-option';

/** A child on a cohort's active roster and their mentor, or none. */
export interface YouthMentorRow {
  childId: string;
  name: string;
  mentor: MentorOption | null;
}
