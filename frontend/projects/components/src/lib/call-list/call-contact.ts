export interface CallContact {
  name: string;
  /** "Mother", shown after the name. */
  relationship: string;
  meta: string | null;
  phone: string;
}
