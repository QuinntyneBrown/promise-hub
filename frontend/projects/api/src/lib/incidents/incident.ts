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
  canReview: boolean;
  review: { note: string; outcome: ReviewOutcome; by: string; at: string } | null;
  followUps: { text: string; by: string; at: string }[];
  trail: { text: string; at: string }[];
}

export type ReviewOutcome = 'ClosedNoAction' | 'ClosedPolicyChange' | 'KeepOpen';

export type IncidentCategory =
  'Injury' | 'IllnessOrAllergicReaction' | 'Behaviour' | 'PickupOrSafeguarding' | 'Other';
