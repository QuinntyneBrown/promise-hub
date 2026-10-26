/** An organization's notification settings; smsUsed is this month's segments, for context. */
export interface NotificationSettings {
  noShowDelayMinutes: number;
  emailSupervisorsOnIncidents: boolean;
  smsCap: number;
  smsUsed: number;
}
