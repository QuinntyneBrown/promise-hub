/** The words for a module or lesson status, as the mocks write them. */
export const STATUS_LABEL: Record<string, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'not-started': 'Not started',
  locked: 'Locked',
  next: 'Up next',
};

/** The badge tone for a status. */
export const STATUS_TONE: Record<string, 'neutral' | 'info' | 'success'> = {
  done: 'success',
  'in-progress': 'info',
  'not-started': 'neutral',
  locked: 'neutral',
  next: 'info',
};
