import type { Permission } from './permission';
import type { Role } from './role';

const GRANTS: Record<Permission, Role[]> = {
  manageSettings: ['Admin', 'ProgramDirector'],
  writeHouseholds: ['Admin', 'ProgramDirector'],
  deleteHouseholds: ['Admin'],
  readMedical: ['Admin', 'ProgramDirector', 'SiteLead'],
  writeMedical: ['Admin', 'ProgramDirector'],
  managePrograms: ['Admin', 'ProgramDirector'],
  manageEvents: ['Admin', 'ProgramDirector', 'SiteLead'],
  cancelEvents: ['Admin', 'ProgramDirector'],
  runSessions: ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker', 'Volunteer', 'Mentor'],
  sendMessages: ['Admin', 'ProgramDirector', 'SiteLead'],
  manageSlips: ['Admin', 'ProgramDirector', 'SiteLead'],
  managePickups: ['Admin', 'ProgramDirector', 'SiteLead'],
  manageStaff: ['Admin'],
  inviteStaff: ['Admin', 'VolunteerCoordinator'],
  assignStaff: ['Admin', 'ProgramDirector', 'SiteLead', 'VolunteerCoordinator'],
  reviewEnrollments: ['Admin', 'ProgramDirector'],
  reviewAttendance: ['Admin', 'ProgramDirector', 'SiteLead', 'Mentor'],
  correctAttendance: ['Admin', 'ProgramDirector'],
  /** Late and excused (L2-095); volunteers mark Present or Absent only (L2-100). */
  qualifyAttendance: ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker', 'Mentor'],
  /** Read every mentor and youth conversation, read only (L2-108). */
  superviseConversations: ['Admin', 'ProgramDirector'],
};

/** Whether a role holds a permission, to hide actions it lacks. The server enforces the same map on every request. */
export function can(role: Role, permission: Permission): boolean {
  return GRANTS[permission].includes(role);
}
