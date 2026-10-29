/** Counts of programs and published content only; the learning counts are null while Learning is off. */
export interface PublicImpact {
  programs: number;
  open: number;
  tracks: number | null;
  modules: number | null;
}
