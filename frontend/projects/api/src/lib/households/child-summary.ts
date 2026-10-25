export interface ChildSummary {
  id: string;
  name: string;
  age: number | null;
  school: string | null;
  /** Null when the role cannot read medical details. */
  medicalFlag: string | null;
}
