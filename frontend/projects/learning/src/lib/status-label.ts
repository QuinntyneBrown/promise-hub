/** The words for a module, lesson, quiz or assignment status, as the mocks write them. */
export const STATUS_LABEL: Record<string, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'not-started': 'Not started',
  locked: 'Locked',
  next: 'Up next',
  passed: 'Passed',
  'not-passed': 'Not passed yet',
  awaiting: 'Waiting for your mentor',
  submitted: 'Submitted',
  'in-review': 'In review',
  'needs-revision': 'Needs revision',
  accepted: 'Accepted',
};

/** The badge tone for a status. */
export const STATUS_TONE: Record<string, 'neutral' | 'info' | 'success' | 'warning'> = {
  done: 'success',
  'in-progress': 'info',
  'not-started': 'neutral',
  locked: 'neutral',
  next: 'info',
  passed: 'success',
  'not-passed': 'warning',
  awaiting: 'info',
  submitted: 'info',
  'in-review': 'info',
  'needs-revision': 'warning',
  accepted: 'success',
};
