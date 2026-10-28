/** When the mentor plans to talk with one of his youth again, from his latest mentor check-in (L2-090 criterion 6). */
export interface MentorFollowUp {
  childId: string;
  youthName: string;
  /** yyyy-MM-dd. */
  followUpOn: string;
  overdue: boolean;
}
