import type { PhBadge } from '../badge/badge';

/** A cell's text, or a status shown as a badge in a tone. */
export type TableCell = string | null | { text: string; tone: ReturnType<PhBadge['tone']> };
