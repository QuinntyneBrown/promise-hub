import type { YouthAttendanceSummary } from './youth-attendance-summary';
import type { YouthLearning } from './youth-learning';
import type { YouthMentoring } from './youth-mentoring';

/** One child's report (L2-127): each section is null while its module is off; learning also without a youth account. */
export interface YouthReport {
  childId: string;
  name: string;
  age: number | null;
  programs: string[];
  hasAccount: boolean;
  learning: YouthLearning | null;
  attendance: YouthAttendanceSummary | null;
  mentoring: YouthMentoring | null;
}
