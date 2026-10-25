/** One incident as its reporter or a supervisor reads it. */
export interface Incident {
  id: string;
  category: IncidentCategory;
  childId: string;
  child: string;
  occurredAt: string;
  place: string;
  whatHappened: string;
  actionTaken: string;
  guardianContact: 'CalledAndReached' | 'LeftMessage' | 'NotYetContacted';
  severity: 'Minor' | 'Moderate' | 'Serious';
  status: 'NeedsReview' | 'Open' | 'Closed';
  reportedBy: string;
  reportedAt: string;
}

export type IncidentCategory =
  'Injury' | 'IllnessOrAllergicReaction' | 'Behaviour' | 'PickupOrSafeguarding' | 'Other';
