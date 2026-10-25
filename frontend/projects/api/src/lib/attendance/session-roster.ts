import type { RosterEntry } from './roster-entry';
import type { SessionSummary } from './session-summary';

export interface SessionRoster {
  session: SessionSummary;
  children: RosterEntry[];
}
