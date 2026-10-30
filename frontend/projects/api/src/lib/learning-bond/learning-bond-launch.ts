/** GET /learning-bond/launch (L2-140): the covered households, how each can be reached, and the launch as chosen. Counts and dates only. */
export interface LearningBondLaunch {
  covered: number;
  mobile: number;
  emailOnly: number;
  neither: number;
  /** The covered programs' names. */
  programs: string[];
  /** No covered household has a guardian with a mobile number: Launch is disabled. */
  noPhoneNumbers: boolean;
  /** 'Scheduled' or 'AtTheDoor' once chosen. */
  mode: 'Scheduled' | 'AtTheDoor' | null;
  /** yyyy-mm-dd, for a scheduled launch. */
  date: string | null;
  /** ISO 8601, once the scheduled launch has sent. */
  launchedAt: string | null;
  /** yyyy-mm-dd: tomorrow and 90 days ahead in the organization's time zone. */
  earliest: string;
  latest: string;
  /** Why Launch is closed while a new agreement version waits, or null. */
  launchBlocked: string | null;
}
