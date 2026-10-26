import type { Role } from './role';

/** One of the signed-in person's organizations. */
export interface MyOrganization {
  membershipId: string;
  name: string;
  role: Role;
  active: boolean;
}
