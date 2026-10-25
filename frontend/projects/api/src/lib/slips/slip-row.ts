export interface SlipRow {
  id: string;
  eventId: string;
  title: string;
  programName: string;
  signBy: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
  children: number;
  signed: number;
  declined: number;
}
