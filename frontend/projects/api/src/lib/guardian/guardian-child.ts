/** A child's page on the guardian portal (mock: guardian-child, L2-102, L2-104): read only. */
export interface GuardianChild {
  language: 'en' | 'es' | 'fr';
  organization: string;
  phone: string | null;
  name: string;
  firstName: string;
  programs: string[];
  /** Sessions of the child's programs that have not ended and start within 28 days, soonest first. */
  schedule: {
    eventId: string;
    name: string;
    program: string;
    startsAt: string;
    endsAt: string;
    place: string | null;
    status: 'Scheduled' | 'Cancelled';
    today: boolean;
  }[];
  consents: {
    /** Null when the child has no youth account. */
    participation: {
      status: 'Given' | 'Withdrawn' | 'Needed';
      signedBy: string | null;
      relationship: string | null;
      signedAt: string | null;
      reference: string | null;
      withdrawnAt: string | null;
      withdrawnBy: string | null;
    } | null;
    /** Null while Slips is off. */
    slips:
      | {
          eventId: string;
          event: string;
          startsAt: string;
          signBy: string;
          status: 'Signed' | 'Declined' | 'NotSigned';
          signedBy: string | null;
          at: string | null;
        }[]
      | null;
  };
  /** Null while Roll Call is off. */
  attendance: {
    present: number;
    late: number;
    excused: number;
    absent: number;
    /** The five most recent marked sessions, newest first. */
    recent: {
      eventId: string;
      name: string;
      startsAt: string;
      status: 'Present' | 'Late' | 'Excused' | 'Absent';
    }[];
  } | null;
  /** Null while Learning is off or when the child has no youth account. Never lesson content, answers or reflections. */
  learning: {
    completedLessons: number;
    totalLessons: number;
    modules: { title: string; track: string; done: number; total: number }[];
    badges: { name: string; icon: string }[];
    badgeCount: number;
  } | null;
}
