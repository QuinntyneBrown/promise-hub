import { Incident } from '@promisehub/api';

/** The words staff read for each incident value, as in the mocks. */
export const CATEGORY: Record<Incident['category'], string> = {
  Injury: 'Injury',
  IllnessOrAllergicReaction: 'Illness or allergic reaction',
  Behaviour: 'Behaviour',
  PickupOrSafeguarding: 'Pickup or safeguarding concern',
  Other: 'Other',
};

export const GUARDIAN: Record<Incident['guardianContact'], string> = {
  CalledAndReached: 'Called and reached',
  LeftMessage: 'Left a message',
  NotYetContacted: 'Not yet contacted',
};

export const STATUS: Record<Incident['status'], string> = {
  NeedsReview: 'Needs review',
  Open: 'Open',
  Closed: 'Closed',
};
