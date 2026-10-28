export interface EventFields {
  name: string;
  programId: string;
  startsAt: string | null;
  endsAt: string | null;
  place: string;
  requiresSlip: boolean;
  noShowAlert: boolean;
  staffNotes: string;
  /** Create one session a week through the program's last day (L2-093); ignored when editing. */
  repeatsWeekly?: boolean;
}
