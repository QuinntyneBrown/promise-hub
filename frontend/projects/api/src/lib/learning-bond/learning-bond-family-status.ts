/** Where a covered household is in Learning Bond, as staff see it (L2-142 criterion 1). */
export type LearningBondFamilyStatus =
  | 'NotInvited'
  | 'Invited'
  | 'Started'
  | 'PausedNeedsSin'
  | 'PausedNeedsTaxReturn'
  | 'PausedNeedsDocument'
  | 'Submitted'
  | 'Deposited'
  | 'CallRequested'
  | 'NotCompleted'
  | 'NotInterested';
