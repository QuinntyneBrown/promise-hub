export interface EventFields {
  name: string;
  programId: string;
  startsAt: string | null;
  endsAt: string | null;
  place: string;
  requiresSlip: boolean;
  noShowAlert: boolean;
  staffNotes: string;
}
