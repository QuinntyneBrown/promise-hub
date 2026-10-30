/** Every field of the application as the guardian reviews it (L2-148 criterion 3); SINs only as their last three digits. */
export interface LearningBondApplicationFields {
  beneficiaryName: string;
  dateOfBirth: string | null;
  childSin: string | null;
  caregiverName: string;
  address: string | null;
  guardianSin: string | null;
  phone: string | null;
  email: string | null;
  language: string;
}
