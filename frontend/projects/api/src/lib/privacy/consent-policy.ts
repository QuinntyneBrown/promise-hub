/** The guardian consent policy (L2-056): youth under the consent age need a guardian's consent to the wording. */
export interface ConsentPolicy {
  consentAge: number;
  wording: string;
}
