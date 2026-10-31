/** POST /learning-bond/agreement/signers: the person who accepts the agreement (L2-137 criterion 1). */
export interface RequestLearningBondSigner {
  name: string;
  title: string;
  email: string;
}
