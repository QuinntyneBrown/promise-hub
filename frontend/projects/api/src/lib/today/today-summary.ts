import type { TodayEvent } from './today-event';
import type { TodaySlip } from './today-slip';
import type { TodayTask } from './today-task';

/** Today's summary: roster counts, slips due (null when Slips is off), what's coming up and the tasks waiting. */
export interface TodaySummary {
  activeChildren: number;
  households: number;
  slipsDue: TodaySlip[] | null;
  comingUp: TodayEvent[];
  tasks: TodayTask[];
}
