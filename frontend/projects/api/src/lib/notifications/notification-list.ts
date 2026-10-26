import type { AppNotification } from './app-notification';

/** The caller's notifications, newest first, with how many are unread. */
export interface NotificationList {
  unread: number;
  items: AppNotification[];
}
