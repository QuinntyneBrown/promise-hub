export type GuardianVerifyOutcome =
  | { status: 'verified' }
  | { status: 'invalid'; message: string }
  | { status: 'locked' }
  | { status: 'gone' }
  | { status: 'error' };
