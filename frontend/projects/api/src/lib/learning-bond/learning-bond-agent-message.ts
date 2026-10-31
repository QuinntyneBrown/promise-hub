/** One message of the household's conversation with the agent (L2-160 criterion 6). */
export interface LearningBondAgentMessage {
  role: 'Guardian' | 'Agent';
  text: string;
  step: string;
  at: string;
}
