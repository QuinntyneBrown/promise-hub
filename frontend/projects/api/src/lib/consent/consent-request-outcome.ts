/** Asking for a guardian's consent (L2-056, L2-058): sent to masked contacts, not needed, nobody to reach, or failed. */
export type ConsentRequestOutcome =
  | { status: 'sent'; sentTo: string[] }
  | { status: 'not-needed' }
  | { status: 'no-guardian' }
  | { status: 'forbidden' }
  | { status: 'error' };
