/** A slip as one guardian sees it for one child. */
export interface GuardianSlip {
  language: 'en' | 'es' | 'fr';
  organization: string;
  phone: string | null;
  guardianName: string;
  event: { name: string; startsAt: string; endsAt: string; place: string | null };
  child: {
    name: string;
    firstName: string;
    age: number;
    allergies: string | null;
    medication: string | null;
  };
  emergencyContact: { name: string; phone: string | null } | null;
  title: string;
  body: string;
  signBy: string;
  askPhotos: boolean;
  askSwimming: boolean;
  askLunch: boolean;
  status: 'Open' | 'Signed' | 'Declined' | 'Closed';
  answeredAt: string | null;
  answeredBy: string | null;
}
