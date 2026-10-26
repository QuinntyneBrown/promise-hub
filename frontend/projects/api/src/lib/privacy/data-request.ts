/** A guardian's request for a copy or deletion of the household's data. */
export interface DataRequest {
  id: string;
  household: string;
  kind: 'Export' | 'Delete';
  email: string;
  requestedAt: string;
  status: 'Open' | 'Fulfilled';
  fulfilledBy: string | null;
}
