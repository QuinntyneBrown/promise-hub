/** One row of an application as reviewed or sent; an editable one names its field. */
export interface LearningBondApplicationRow {
  label: string;
  value: string;
  field: 'address' | 'phone' | 'email' | null;
  error: string | null;
}
