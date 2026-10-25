import type { Role } from './role';

/** The signed-in person and the organization of their active membership (GET /me). */
export interface Session {
  personName: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  plan: 'Free' | 'Standard' | 'Plus';
}
