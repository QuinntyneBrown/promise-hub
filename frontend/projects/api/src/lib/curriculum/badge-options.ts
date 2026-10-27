import type { BadgeCompetency } from './badge-competency';
import type { BadgeTarget } from './badge-target';

/** What the badge builder offers (L2-084 criterion 2). */
export interface BadgeOptions {
  lessons: BadgeTarget[];
  modules: BadgeTarget[];
  quizzes: BadgeTarget[];
  assignments: BadgeTarget[];
  competencies: BadgeCompetency[];
}
