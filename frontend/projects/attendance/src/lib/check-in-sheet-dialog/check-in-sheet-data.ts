import type { RosterEntry } from '@promisehub/api';

/** What the check-in sheet needs: the child, and whether the caller may mark late or excused (L2-095, L2-100). */
export interface CheckInSheetData {
  entry: RosterEntry;
  qualifiers: boolean;
}
