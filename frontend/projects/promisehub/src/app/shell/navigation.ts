import type { NavItem } from '@promisehub/components';

/**
 * Every section of the staff app. Module configuration (slice 03) will filter this list;
 * until then every section is shown. Incidents and Settings live in More at every width.
 */
export const NAVIGATION: NavItem[] = [
  { label: 'Today', link: '/', icon: 'today', placement: 'primary', tab: true },
  { label: 'Check-in', link: '/check-in', icon: 'check-in', placement: 'primary', tab: true },
  { label: 'Families', link: '/families', icon: 'families', placement: 'primary', tab: true },
  { label: 'Events', link: '/events', icon: 'events', placement: 'primary', tab: true },
  { label: 'Programs', link: '/programs', icon: 'programs', placement: 'wide' },
  { label: 'Messages', link: '/messages', icon: 'messages', placement: 'wide' },
  { label: 'Reports', link: '/reports', icon: 'reports', placement: 'wide' },
  { label: 'Incidents', link: '/incidents', icon: 'incidents', placement: 'overflow' },
  { label: 'Settings', link: '/settings', icon: 'settings', placement: 'overflow' },
  { label: 'Notifications', link: '/notifications', icon: 'notifications', placement: 'overflow' },
  { label: 'Your account', link: '/account', icon: 'account', placement: 'overflow' },
];
