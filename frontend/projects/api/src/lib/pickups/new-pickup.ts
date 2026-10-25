/** An adult to approve for pickup; with siblings, for every child of the household. */
export interface NewPickup {
  name: string;
  relationship: string;
  mobile: string | null;
  siblings: boolean;
}
