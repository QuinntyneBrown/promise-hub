/** A plan change, or why it was refused. */
export type PlanChange =
  | { status: 'changed'; plan: string; proratedCharge: number }
  | { status: 'invalid'; message: string }
  | { status: 'error' };
