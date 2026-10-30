import type { LearningBondInvitationLanguage } from './learning-bond-invitation-language';

/** GET /learning-bond/invitation (L2-139): the sender name and the platform wording per language. */
export interface LearningBondInvitation {
  senderName: string;
  languages: LearningBondInvitationLanguage[];
}
