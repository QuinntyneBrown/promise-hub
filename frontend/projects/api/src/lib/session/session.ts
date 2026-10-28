import type { ModuleId } from '../modules/module-id';
import type { DisplayPreferences } from '../display/display-preferences';
import type { Role } from './role';

/** The signed-in person and the organization of their active membership (GET /me). */
export interface Session {
  personName: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  plan: 'Free' | 'Standard' | 'Plus';
  /** The modules on for this organization; navigation is composed from these only. */
  modules: ModuleId[];
  /** The active membership; what this device keeps, such as drafts, is kept under it. */
  membershipId: string;
  /** The person's display preferences, applied by the shell once per session (L2-119, L2-120). */
  display: DisplayPreferences;
}
