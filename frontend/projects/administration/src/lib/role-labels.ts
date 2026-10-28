import { Role } from '@promisehub/api';
import { RadioOption } from '@promisehub/components';

/** The roles an admin can give, with what each may do (dialogs: invite-staff, change-role). */
export const ROLE_OPTIONS: RadioOption[] = [
  { value: 'YouthWorker', label: 'Youth worker', hint: 'Runs the sessions they’re assigned' },
  { value: 'SiteLead', label: 'Site lead', hint: 'Runs any session, sends messages and slips' },
  {
    value: 'VolunteerCoordinator',
    label: 'Volunteer coordinator',
    hint: 'Reads rosters and slips',
  },
  {
    value: 'ProgramDirector',
    label: 'Program director',
    hint: 'Programs, enrollment, incident review',
  },
  { value: 'Admin', label: 'Admin', hint: 'Everything, including staff and billing' },
];

/** The roles an admin can invite (dialog: invite-staff): the staff roles plus Mentor and Volunteer (L2-051). */
export const INVITE_ROLE_OPTIONS: RadioOption[] = [
  ...ROLE_OPTIONS,
  { value: 'Mentor', label: 'Mentor', hint: 'Sees only the youth assigned to them' },
  { value: 'Volunteer', label: 'Volunteer', hint: 'Runs the sessions they’re assigned' },
];

/** Roles that hold no staff permission (ADR 0043); moving one of them to a staff role widens what the person sees. */
export const PARTICIPANT_ROLES: Role[] = ['Youth', 'Mentor', 'Volunteer'];
