import type { MentorAttendance } from './mentor-attendance';
import type { MentorGuardianContact } from './mentor-guardian-contact';

/** The mentor-safe record of a youth (L2-064): never the date of birth or anything medical; attendance is null while Roll Call is off. */
export interface MentorYouthRecord {
  id: string;
  name: string;
  preferredName: string | null;
  pronouns: string | null;
  age: number | null;
  school: string | null;
  programs: string[];
  mentor: string | null;
  guardians: MentorGuardianContact[];
  recentAttendance: MentorAttendance[] | null;
}
