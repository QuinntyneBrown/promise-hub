/** PUT .../intake: the answers given now; a field left out keeps what was given before. */
export interface SaveLearningBondIntake {
  guardianSin?: string | null;
  childSin?: string | null;
  taxFiled?: string | null;
}
