/**
 * POST /g/learning-bond/{token}/agent (L2-160): the step's approved fixed line, the reply that replaces it (null when the model was slow,
 * down or unusable) and which one the bubble shows.
 */
export interface LearningBondAgentReply {
  step: string;
  fixed: string;
  reply: string | null;
  source: 'model' | 'fixed';
}
