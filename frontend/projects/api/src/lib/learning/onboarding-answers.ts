/** One saved setup step: the answers so far and the step to resume at (L2-059). */
export interface OnboardingAnswers {
  step: number;
  preferredName: string;
  pronouns: 'she/her' | 'he/him' | 'they/them' | null;
  lessonReminders: boolean;
  mentorMessages: boolean;
  announcements: boolean;
}
