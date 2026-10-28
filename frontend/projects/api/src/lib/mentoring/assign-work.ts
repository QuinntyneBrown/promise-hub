/** Assigning work (L2-092 criterion 2): the kind and item, chosen youth or one cohort, the due date as yyyy-MM-dd and an optional message. */
export interface AssignWork {
  kind: 'Lesson' | 'Quiz' | 'Assignment';
  itemId: string;
  childIds: string[];
  programId: string | null;
  dueOn: string;
  message: string | null;
}
