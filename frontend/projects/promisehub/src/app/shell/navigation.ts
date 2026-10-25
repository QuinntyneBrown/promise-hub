import type { ModuleId } from '@promisehub/api';
import type { NavItem } from '@promisehub/components';

/** A section of the staff app and the module it belongs to; sections without a module are always shown. */
export interface Section extends NavItem {
  module?: ModuleId;
}

/**
 * Every section of the staff app. Navigation shows only sections whose module is on (L2-005).
 * Events and Programs follow Permission slips (ADR 0006). Incidents and Settings live in More at every width.
 */
export const NAVIGATION: Section[] = [
  { label: 'Today', link: '/', icon: 'today', placement: 'primary', tab: true },
  {
    label: 'Check-in',
    link: '/check-in',
    icon: 'check-in',
    placement: 'primary',
    tab: true,
    module: 'RollCall',
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
  { label: 'Settings', link: '/settings', icon: 'settings', placement: 'overflow' },
  { label: 'Notifications', link: '/notifications', icon: 'notifications', placement: 'overflow' },
  { label: 'Your account', link: '/account', icon: 'account', placement: 'overflow' },
];

export function navigationFor(modules: readonly ModuleId[]): NavItem[] {
  return NAVIGATION.filter((section) => !section.module || modules.includes(section.module));
}
