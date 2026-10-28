import type { AtRiskFlag } from '@promisehub/api';

/** What opens the resolve-flag dialog: the open flag to resolve. */
export interface ResolveFlagDialogData {
  flag: AtRiskFlag;
}
