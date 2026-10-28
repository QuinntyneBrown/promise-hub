/** Raising an at-risk flag (L2-091 criterion 2); severity by name. */
export interface RaiseAtRiskFlag {
  childId: string | null;
  severity: string | null;
  reason: string;
}
