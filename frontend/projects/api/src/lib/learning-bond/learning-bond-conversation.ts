import type { LearningBondAgentMessage } from './learning-bond-agent-message';

/** GET /g/learning-bond/{token}/agent/conversation: the household's own conversation, oldest first. */
export interface LearningBondConversation {
  messages: LearningBondAgentMessage[];
}
