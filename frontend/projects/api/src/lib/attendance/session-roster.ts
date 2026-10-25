import type { RosterEntry } from './roster-entry';
import type { SessionSummary } from './session-summary';

export interface SessionRoster {
  session: SessionSummary;
  children: RosterEntry[];
  /** Set when the roster came from this device without signal: when it was saved. */
  savedAt?: string;
}
