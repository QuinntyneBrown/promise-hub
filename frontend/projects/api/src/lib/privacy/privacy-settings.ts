/** Privacy and data: the fixed region and consent retention (null: until deleted by request). */
export interface PrivacySettings {
  region: string;
  consentRetentionYears: number | null;
}
