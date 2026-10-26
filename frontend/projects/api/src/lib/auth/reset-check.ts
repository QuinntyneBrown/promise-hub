/** Whether a reset link can be used, and for whom. */
export type ResetCheck = { status: 'ok'; email: string } | { status: 'gone' } | { status: 'error' };
