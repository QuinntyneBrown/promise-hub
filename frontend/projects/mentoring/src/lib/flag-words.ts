import type { AtRiskFlag } from '@promisehub/api';
import { type RadioOption, formatDay } from '@promisehub/components';

/** How serious a flag is, with a hint so it never relies on one word alone (L2-091). */
export const SEVERITY_OPTIONS: RadioOption[] = [
  { value: 'Low', label: 'Low', hint: 'Keep an eye on it' },
  { value: 'Medium', label: 'Medium', hint: 'Needs a plan this week' },
  { value: 'High', label: 'High', hint: 'Needs attention today' },
];

/** High reads as danger, Medium as a warning, Low stays neutral. */
export function severityTone(severity: string): 'neutral' | 'warning' | 'danger' {
  return severity === 'High' ? 'danger' : severity === 'Medium' ? 'warning' : 'neutral';
}

/** “Raised by Daniel Osei · Wed 4 Nov”. */
export function raisedLine(f: AtRiskFlag): string {
  return `Raised by ${f.raisedBy} · ${formatDay(f.raisedAt)}`;
}

/** How a flag was resolved, as the dialog and the resolved list say it (Waypoint's resolution reasons). */
export const OUTCOME_LABEL: Record<string, string> = {
  Reconnected: 'Reconnected, back on track',
  HandedToDirector: 'Handed to the program director',
  LeftProgram: 'Left the program',
  FlaggedInError: 'Flagged in error',
};

export const OUTCOME_OPTIONS: RadioOption[] = Object.entries(OUTCOME_LABEL).map(
  ([value, label]) => ({ value, label }),
);

/** “Reconnected, back on track · Resolved by Daniel Osei · Sat 31 Oct · Note: …”, or null while the flag is open. */
export function resolvedLine(f: AtRiskFlag): string | null {
  if (f.status !== 'Resolved' || !f.outcome || !f.resolvedAt) return null;
  const line = `${OUTCOME_LABEL[f.outcome] ?? f.outcome} · Resolved by ${f.resolvedBy ?? 'Former staff'} · ${formatDay(f.resolvedAt)}`;
  return f.resolutionNote ? `${line} · Note: ${f.resolutionNote}` : line;
}
