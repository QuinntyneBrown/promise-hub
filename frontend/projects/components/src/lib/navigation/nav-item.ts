import type { IconName } from '../icon/icon-name';

/**
 * One destination in the shell's navigation.
 * `placement` decides where the top bar shows it: `primary` from 768px, `wide` from 1024px,
 * `overflow` never (More only). The phone tab bar shows items with `tab: true`.
 */
export interface NavItem {
  label: string;
  link: string;
  icon: IconName;
  placement: 'primary' | 'wide' | 'overflow';
  tab?: boolean;
}
