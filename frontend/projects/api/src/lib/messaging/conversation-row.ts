/** One conversation on the list (L2-106 criterion 1). */
export interface ConversationRow {
  youthId: string;
  youthName: string;
  mentorId: string | null;
  mentorName: string | null;
  lastMessage: string | null;
  lastMessageMine: boolean;
  lastMessageAt: string | null;
  unread: number;
  /** "consent" while a guardian's consent is needed (L2-108). */
  blocked: string | null;
}
