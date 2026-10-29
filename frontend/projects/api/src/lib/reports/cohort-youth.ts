/** One child of a cohort report; `learning` is null without a youth account, `checkIns` while Mentoring is off. */
export interface CohortYouth {
  childId: string;
  name: string;
  hasAccount: boolean;
  learning: number | null;
  attendanceRate: number | null;
  checkIns: number | null;
  status: 'OnTrack' | 'AtRisk' | 'Ended';
}
