import type { MySession } from './my-session';

/** The sessions the caller is assigned to in the next four weeks, soonest first (GET /sessions/mine). */
export interface MySchedule {
  sessions: MySession[];
}
