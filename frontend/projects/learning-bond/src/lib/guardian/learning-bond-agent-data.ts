import { LearningBondAgentStep } from '@promisehub/api';
import { GuardianLearningBondText } from './guardian-learning-bond-text';

/** What the Ask dialog needs: the link, the step the guardian is on and the page's words. */
export interface LearningBondAgentData {
  token: string;
  step: LearningBondAgentStep;
  text: GuardianLearningBondText;
}
