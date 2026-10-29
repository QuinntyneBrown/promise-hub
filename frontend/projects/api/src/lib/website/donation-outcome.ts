/** How starting a monthly donation ended (L2-134 criterion 3). */
export type DonationOutcome =
  /** The provider's hosted checkout, where the visitor finishes. */
  | { status: 'checkout'; checkoutUrl: string }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'too-many' }
  /** The organization has no payment provider set up. */
  | { status: 'unavailable' }
  | { status: 'not-found' }
  | { status: 'error' };
