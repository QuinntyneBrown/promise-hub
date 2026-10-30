import type { LearningBondFamilyStatus } from './learning-bond-family-status';

/** Each status as staff read it, in the order the filter offers them. */
export const LEARNING_BOND_FAMILY_STATUS_LABELS: Record<LearningBondFamilyStatus, string> = {
  NotInvited: 'Not invited',
  Invited: 'Invited',
  Started: 'Started',
  PausedNeedsSin: 'Paused: needs a SIN',
  PausedNeedsTaxReturn: 'Paused: needs a tax return',
  PausedNeedsDocument: 'Paused: needs a document',
  Submitted: 'Submitted',
  Deposited: 'Deposited',
  CallRequested: 'Call requested',
  NotCompleted: 'Not completed',
  NotInterested: 'Not interested',
};
