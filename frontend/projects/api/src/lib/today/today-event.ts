/** An event in the next two weeks. */
export interface TodayEvent {
  id: string;
  name: string;
  startsAt: string;
  place: string | null;
  requiresSlip: boolean;
}
