import type { BadgeYouth } from '@promisehub/api';

/** The badge to award by hand and the youth who can still earn it. */
export interface AwardBadgeDialogData {
  id: string;
  name: string;
  youth: BadgeYouth[];
}
