/** Approve all: how many were approved, or why it failed (L2-081 criterion 4). */
export type ApproveAllOutcome = { status: 'saved'; approved: number } | { status: 'error' };
