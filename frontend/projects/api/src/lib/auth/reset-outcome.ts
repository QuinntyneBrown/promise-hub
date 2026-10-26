/** What choosing a new password led to. */
export type ResetOutcome =
  | { status: 'signed-in' }
  | { status: 'mfa-required' }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'gone' }
  | { status: 'error' };
