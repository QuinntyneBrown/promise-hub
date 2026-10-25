/** Where a question to the guardian about an unlisted adult stands. */
export interface PickupRequest {
  id: string;
  childId: string;
  collectorName: string;
  status: 'Pending' | 'Approved' | 'Refused';
  decidedBy: string | null;
  decidedAt: string | null;
  /** The incident logged for a refusal. */
  incidentId: string | null;
}
