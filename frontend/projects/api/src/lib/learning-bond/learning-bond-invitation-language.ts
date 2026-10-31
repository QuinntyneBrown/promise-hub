/** The invitation in one language the households use, filled with a sample child, guardian and link (L2-139 criterion 1). */
export interface LearningBondInvitationLanguage {
  code: string;
  name: string;
  sms: string;
  smsCharacters: number;
  smsSegments: number;
  emailTitle: string;
  emailText: string;
  emailAction: string;
  emailFooter: string;
}
