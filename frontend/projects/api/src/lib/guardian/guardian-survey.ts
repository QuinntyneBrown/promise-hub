/** The survey about one child after an event; status is Open, Answered or Closed. */
export interface GuardianSurvey {
  language: 'en' | 'es' | 'fr';
  organization: string;
  organizationPhone: string | null;
  guardianFirstName: string;
  eventName: string;
  childFirstName: string;
  sentBy: string;
  status: 'Open' | 'Answered' | 'Closed';
}
