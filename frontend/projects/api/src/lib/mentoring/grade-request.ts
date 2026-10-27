/** A grade (L2-080 criteria 3 to 5): the decision, whole points per criterion, the comment or note, and the version it was read at. */
export interface GradeRequest {
  decision: 'draft' | 'approve' | 'revise';
  scores: { criterionId: string; points: number }[];
  comment: string | null;
  version: number;
}
