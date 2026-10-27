/** A youth on a cohort’s active roster, with their own mentor or none. */
export interface MentorCohortMember {
  id: string;
  name: string;
  age: number | null;
  mentor: string | null;
}
