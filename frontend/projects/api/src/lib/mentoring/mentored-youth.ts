/** One youth in the mentor’s scope: age (never the date of birth) and the names of their active programs. */
export interface MentoredYouth {
  id: string;
  name: string;
  age: number | null;
  programs: string[];
}
