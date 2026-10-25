export interface SlipResponse {
  childId: string;
  child: string;
  household: string;
  status: 'Signed' | 'Declined' | 'Outstanding';
  signedBy: string | null;
}
