import type { ConversationRow } from './conversation-row';

/** The reader's conversations, the latest message first. */
export interface ConversationList {
  conversations: ConversationRow[];
}
