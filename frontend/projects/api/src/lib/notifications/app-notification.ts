/** One in-app notice; readAt is null while unread. */
export interface AppNotification {
  id: string;
  kind: string;
  text: string;
  link: string;
  createdAt: string;
  readAt: string | null;
}
