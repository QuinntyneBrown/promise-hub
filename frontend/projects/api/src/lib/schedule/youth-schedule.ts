import type { ScheduleSession } from './schedule-session';

/** Her sessions in the next 28 days, soonest first (L2-094 criterion 1). */
export interface YouthSchedule {
  sessions: ScheduleSession[];
}
