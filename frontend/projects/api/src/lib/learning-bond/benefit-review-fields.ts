/** Every field of a benefit application as reviewed (L2-156 criterion 2); the SIN only as its last three digits. */
export interface BenefitReviewFields {
  applicantName: string;
  applicantSin: string | null;
  maritalStatus: string;
  householdSize: string;
  children: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  canadaChildBenefit: string;
  program: string;
}
