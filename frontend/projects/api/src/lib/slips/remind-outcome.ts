export type RemindOutcome =
  | { status: 'sent'; households: number; unreachable: number }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'error' };
