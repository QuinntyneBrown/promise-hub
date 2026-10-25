import type { Incident } from './incident';

export type IncidentSummary = Pick<
  Incident,
  'id' | 'category' | 'child' | 'occurredAt' | 'severity' | 'status' | 'reportedBy'
>;
