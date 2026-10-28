/** One at-risk flag as its readers see it (L2-091): Open or Resolved, with the resolution once resolved. */
export interface AtRiskFlag {
  id: string;
  childId: string;
  youthName: string;
  severity: string;
  reason: string;
  raisedBy: string;
  raisedAt: string;
  status: 'Open' | 'Resolved';
  outcome: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
}
