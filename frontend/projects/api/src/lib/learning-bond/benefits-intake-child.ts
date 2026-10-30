/** A child the benefits intake reuses (L2-154): who claims them, when asked. */
export interface BenefitsIntakeChild {
  id: string;
  firstName: string;
  age: number | null;
  claims: 'Me' | 'OtherParent' | 'Shared' | 'NotSure' | null;
}
