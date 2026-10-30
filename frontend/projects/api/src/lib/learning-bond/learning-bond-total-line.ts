/** One line of the running total (L2-158): the child (null for the family), the stream, the amount, confirmed or applied for. */
export interface LearningBondTotalLine {
  child: string | null;
  stream: string;
  amount: number;
  confirmed: boolean;
}
