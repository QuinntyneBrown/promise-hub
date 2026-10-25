/** A family still to answer a slip, with its last reminder and whether it can be reached. */
export interface UnsignedFamily {
  householdId: string;
  household: string;
  guardian: string | null;
  children: string[];
  lastRemindedAt: string | null;
  reachable: boolean;
  reason: string | null;
}
