/** The plan, its limits and this month's usage; status is Active, PaymentFailed or Suspended. */
export interface Billing {
  plan: 'Free' | 'Standard' | 'Plus';
  monthlyPrice: number;
  childLimit: number;
  activeChildren: number;
  smsUsed: number;
  smsCap: number;
  status: 'Active' | 'PaymentFailed' | 'Suspended';
  graceUntil: string | null;
}
