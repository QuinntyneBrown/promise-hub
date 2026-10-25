export interface ProgramEvent {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: 'Scheduled' | 'Cancelled';
}
