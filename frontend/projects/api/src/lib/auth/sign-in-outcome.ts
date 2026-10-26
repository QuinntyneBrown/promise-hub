/** What a sign-in step led to. Failures are outcomes too, so pages never read HTTP errors. */
export type SignInOutcome =
  | { status: 'signed-in' }
  | { status: 'mfa-required' }
  | { status: 'invalid' }
  | { status: 'locked'; lockedUntil: string }
  | { status: 'deactivated' }
  | { status: 'error' };
