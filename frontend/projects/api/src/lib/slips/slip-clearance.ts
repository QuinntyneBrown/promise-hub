/** The day-of view of a session whose event needs a slip; missing children first. */
export interface SlipClearance {
  slipId: string;
  title: string;
  cleared: number;
  missing: number;
  declined: number;
  children: {
    childId: string;
    householdId: string;
    name: string;
    status: 'Cleared' | 'Missing' | 'Declined';
  }[];
}
