import type { ModuleId, Role } from '@promisehub/api';
import type { NavItem } from '@promisehub/components';

const STAFF: Role[] = [
  'Admin',
  'ProgramDirector',
  'SiteLead',
  'YouthWorker',
  'VolunteerCoordinator',
];
const EVERYONE: Role[] = [...STAFF, 'Youth', 'Mentor', 'Volunteer'];

/**
 * A section of the app, the module it belongs to and the roles it serves. A section without a module is shown whatever is
 * on; a section without roles serves the five staff roles (ADR 0043).
 */
export interface Section extends NavItem {
  module?: ModuleId;
  roles?: Role[];
}

/**
 * Every section of the app. Navigation shows only sections whose module is on (L2-005) and that serve the role (L2-038).
 * Events and Programs follow Permission slips (ADR 0006). Incidents and Settings live in More at every width.
 */
export const NAVIGATION: Section[] = [
  { label: 'Today', link: '/', icon: 'today', placement: 'primary', tab: true, roles: EVERYONE },
  {
    label: 'Learning',
    link: '/learning',
    icon: 'learning',
    placement: 'primary',
    tab: true,
    module: 'Learning',
    roles: ['Youth'],
  },
  {
    label: 'Mentoring',
    link: '/mentoring',
    icon: 'mentoring',
    placement: 'primary',
    tab: true,
    module: 'Mentoring',
    roles: ['Mentor'],
  },
  {
    label: 'Check-in',
    link: '/check-in',
    icon: 'check-in',
    placement: 'primary',
    tab: true,
    module: 'RollCall',
    roles: [...STAFF, 'Volunteer'],
  },
  {
    label: 'Families',
    link: '/families',
    icon: 'families',
    placement: 'primary',
    tab: true,
    module: 'Roster',
  },
  {
    label: 'Events',
    link: '/events',
    icon: 'events',
    placement: 'primary',
    tab: true,
    module: 'Slips',
  },
  { label: 'Programs', link: '/programs', icon: 'programs', placement: 'wide', module: 'Slips' },
  { label: 'Messages', link: '/messages', icon: 'messages', placement: 'wide', module: 'Messages' },
  { label: 'Reports', link: '/reports', icon: 'reports', placement: 'wide', module: 'Reports' },
  {
    label: 'Permission slips',
    link: '/slips',
    icon: 'slips',
    placement: 'overflow',
    module: 'Slips',
  },
  {
    label: 'Incidents',
    link: '/incidents',
    icon: 'incidents',
    placement: 'overflow',
    module: 'Incidents',
  },
  {
    label: 'Applications',
    link: '/applications',
    icon: 'inbox',
    placement: 'overflow',
    module: 'Roster',
    roles: ['Admin', 'ProgramDirector'],
  },
  {
    label: 'Curriculum',
    link: '/curriculum',
    icon: 'curriculum',
    placement: 'overflow',
    module: 'Learning',
    roles: ['Admin', 'ProgramDirector'],
  },
  { label: 'Settings', link: '/settings', icon: 'settings', placement: 'overflow' },
  {
    label: 'Notifications',
    link: '/notifications',
    icon: 'notifications',
    placement: 'overflow',
    roles: EVERYONE,
  },
  {
    label: 'Your account',
    link: '/account',
    icon: 'account',
    placement: 'overflow',
    roles: EVERYONE,
  },
];

export function navigationFor(modules: readonly ModuleId[], role: Role): NavItem[] {
  return NAVIGATION.filter(
    (section) =>
      (!section.module || modules.includes(section.module)) &&
      (section.roles ?? STAFF).includes(role),
  );
}
