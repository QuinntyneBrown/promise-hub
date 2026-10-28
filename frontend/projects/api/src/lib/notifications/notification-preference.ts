/** One kind a member may choose (L2-111): its key, name, what it covers and whether it reaches them in the app. */
export interface NotificationPreference {
  key: string;
  name: string;
  hint: string;
  inApp: boolean;
}
