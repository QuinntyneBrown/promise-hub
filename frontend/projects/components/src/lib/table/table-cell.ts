import type { PhBadge } from '../badge/badge';

/**
 * A cell's text; a status shown as a badge in a tone; or text followed by a badge that qualifies it (a name flagged
 * "Below 70%"), said in words so the badge never carries meaning by colour alone.
 */
export type TableCell =
  | string
  | null
  | { text: string; tone: ReturnType<PhBadge['tone']> }
  | { text: string; badge: { text: string; tone: ReturnType<PhBadge['tone']> } };
