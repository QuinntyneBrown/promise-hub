import type { Incident } from './incident';

/** What the reporter submits; the server names every missing fact. */
export interface IncidentReport {
  category: Incident['category'] | null;
  childId: string | null;
  occurredAt: string | null;
  place: string | null;
  whatHappened: string;
  actionTaken: string;
  guardianContact: Incident['guardianContact'] | null;
  severity: Incident['severity'] | null;
}
