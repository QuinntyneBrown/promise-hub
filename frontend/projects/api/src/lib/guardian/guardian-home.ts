/** The household's home page: where each child stands in each program (mock: guardian-home). */
export interface GuardianHome {
  language: 'en' | 'es' | 'fr';
  organization: string;
  phone: string | null;
  firstName: string;
  children: {
    id: string;
    allergies?: string | null;
    medication?: string | null;
    /** Adults besides the guardians who may collect the child; null while Pickup is off. */
    pickups: { id: string; name: string; relationship: string }[] | null;
    name: string;
    firstName: string;
    /** The active programs the child is enrolled in (L2-102 criterion 1). */
    programs: string[];
    enrollments: {
      program: string;
      status: 'Enrolled' | 'WaitingReview' | 'Waitlisted' | 'Declined';
      position: number | null;
      note: string | null;
      startsOn: string;
      schedule: string | null;
    }[];
  }[];
  /** No-show texts the household hasn't answered, per session. */
  noShows: { eventId: string; event: string; startsAt: string; children: string[] }[];
  /** Someone waiting to collect a child, for the guardian to approve or refuse. */
  pickupRequests?: {
    id: string;
    child: string;
    collector: string;
    event: string;
    requestedAt: string;
  }[];
  /** How many announcements the household has not read; null while Messages is off (L2-103). */
  announcements?: number | null;
  /** The Learning Bond card (L2-144 criterion 7): null until the household is invited, after I'm not interested, or with the module off. */
  learningBond?: {
    children: {
      id: string;
      firstName: string;
      status: 'Invited' | 'Started' | 'Paused' | 'Submitted' | 'Deposited' | 'NotCompleted';
    }[];
  } | null;
  /** How the family page reaches the primary guardian, for them to correct. */
  contact?: { name: string; mobile: string | null; email: string | null; language: string } | null;
}
