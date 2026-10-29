/** A child's mentoring without what was said: the mentor, check-ins, the latest date and engagement, an open flag. */
export interface YouthMentoring {
  mentorName: string | null;
  checkIns: number;
  latestOn: string | null;
  latestEngagement: string | null;
  openFlag: boolean;
}
