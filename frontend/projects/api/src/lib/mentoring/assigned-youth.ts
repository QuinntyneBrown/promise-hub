import type { MentoredYouth } from './mentored-youth';

/** The youth assigned to the mentor; empty until assignments exist. */
export interface AssignedYouth {
  youth: MentoredYouth[];
}
