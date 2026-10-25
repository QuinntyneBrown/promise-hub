import type { AvatarTint } from '../avatar/avatar-tint';
import type { NavItem } from '../navigation/nav-item';

export interface NavDrawerData {
  items: NavItem[];
  homeLink: string;
  personName: string;
  avatarTint: AvatarTint;
  /** "Site lead · Harbourview Youth Collective" */
  context: string;
}
