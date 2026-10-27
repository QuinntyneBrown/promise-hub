/** One step of the youth's milestones: when she joined a program, a badge earned, or the badge she is closest to. */
export interface Milestone {
  kind: 'joined' | 'badge' | 'next';
  title: string;
  text: string;
  at: string | null;
}
