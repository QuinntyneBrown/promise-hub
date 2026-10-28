/** What each kind of notice is called in its meta line (L2-109); an unknown kind shows none. */
export const NOTIFICATION_KIND_LABELS: Readonly<Record<string, string>> = {
  learning: 'Learning',
  assignments: 'Assigned work',
  messages: 'Message',
  announcements: 'Announcement',
  incidents: 'Incident',
  mentoring: 'At-risk flag',
  requests: 'Data request',
  staff: 'Staff',
};
