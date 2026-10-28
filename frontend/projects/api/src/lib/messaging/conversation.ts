import type { DirectMessage } from './direct-message';

/** One conversation (L2-106 criterion 2, L2-108): read only for a supervisor. */
export interface Conversation {
  youthId: string;
  youthName: string;
  mentorId: string | null;
  mentorName: string | null;
  readOnly: boolean;
  canSend: boolean;
  blocked: string | null;
  messages: DirectMessage[];
}
