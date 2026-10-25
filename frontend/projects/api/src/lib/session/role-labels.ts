import type { Role } from './role';

/** How each role reads in the interface. */
export const ROLE_LABELS: Record<Role, string> = {
  Admin: 'Admin',
  ProgramDirector: 'Program director',
  SiteLead: 'Site lead',
  YouthWorker: 'Youth worker',
  VolunteerCoordinator: 'Volunteer coordinator',
};
