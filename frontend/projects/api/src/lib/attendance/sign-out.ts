/** Who collected the child: an approved guardian, or someone else the guardian okayed by phone. */
export interface SignOut {
  childId: string;
  guardianId: string | null;
  someoneElse: boolean;
  otherName: string | null;
  guardianConfirmed: boolean;
  idChecked: boolean;
  /** Null for now. */
  leftAt: string | null;
  clientActionId: string;
}
