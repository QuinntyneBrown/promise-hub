/** The household's home page: where each child stands in each program (mock: guardian-home). */
export interface GuardianHome {
  language: 'en' | 'es' | 'fr';
  organization: string;
  phone: string | null;
  firstName: string;
  children: {
    name: string;
    firstName: string;
    enrollments: {
      program: string;
      status: 'Enrolled' | 'WaitingReview' | 'Waitlisted' | 'Declined';
      position: number | null;
      note: string | null;
      startsOn: string;
      schedule: string | null;
    }[];
  }[];
}
