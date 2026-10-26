/** A new tenant: its name, first admin, plan and module preset. */
export interface NewOrganization {
  name: string;
  adminEmail: string;
  plan: 'Free' | 'Standard';
  preset: 'Whole suite' | 'Just check-in' | 'Just slips';
}
