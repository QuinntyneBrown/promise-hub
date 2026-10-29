/** How a request sent from the public website ended (L2-134). */
export type WebsiteSubmitOutcome =
  | { status: 'sent' }
  | { status: 'invalid'; errors: Record<string, string> }
  /** Five requests of this kind from this email in the last hour. */
  | { status: 'too-many' }
  | { status: 'not-found' }
  | { status: 'error' };
