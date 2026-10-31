/**
 * GET /learning-bond/households/{id}: the household's Learning Bond card for staff in the status roles (L2-140 criteria 4 and 5). Never a
 * contact, a SIN or an amount.
 */
export interface LearningBondHousehold {
  householdId: string;
  name: string;
  covered: boolean;
  programs: string[];
  /** The eligible children's first names. */
  children: string[];
  /** ISO 8601: when invited within the last 7 days, else null. */
  invitedAt: string | null;
  /** The guardians the invitation reaches. */
  recipients: string[];
  /** The household's language, such as "English". */
  language: string;
  /** The text the invitation carries, with a sample link, and its length and SMS segments. */
  sms: string;
  smsCharacters: number;
  smsSegments: number;
}
