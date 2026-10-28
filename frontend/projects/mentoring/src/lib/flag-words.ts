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
