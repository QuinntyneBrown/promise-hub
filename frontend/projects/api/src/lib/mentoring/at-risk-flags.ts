import type { AtRiskFlag } from './at-risk-flag';

/** The flags the caller reads (L2-091 criterion 4): open or resolved, both counts, the mentor's youth and whether the caller may raise one. */
export interface AtRiskFlags {
  items: AtRiskFlag[];
  openCount: number;
  resolvedCount: number;
  youth: { id: string; name: string }[];
  canRaise: boolean;
}
