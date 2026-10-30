/** A child on the guardian's Learning Bond page (L2-144): "up to" an amount, or claiming for themselves at 18 to 20. */
export interface GuardianLearningBondChild {
  id: string;
  firstName: string;
  age: number | null;
  programs: string[];
  /** Dollars the rule estimates; null for a child who claims for themselves or was born before 2004. */
  amount: number | null;
  selfClaim: boolean;
}
