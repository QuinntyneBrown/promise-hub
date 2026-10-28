/** The household's announcements on the guardian pages (mock: guardian-announcements, L2-103), newest first. */
export interface GuardianAnnouncements {
  language: 'en' | 'es' | 'fr';
  organization: string;
  phone: string | null;
  unread: number;
  announcements: {
    id: string;
    title: string;
    body: string;
    from: string;
    sentAt: string;
    read: boolean;
  }[];
}
