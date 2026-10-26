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
