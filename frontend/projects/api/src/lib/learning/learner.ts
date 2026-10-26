import type { LearnerChild } from './learner-child';

/** The signed-in youth and the child record their account links to; null until an admin links one. */
export interface Learner {
  personName: string;
  child: LearnerChild | null;
}
