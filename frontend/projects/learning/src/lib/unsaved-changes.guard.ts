import type { CanDeactivateFn } from '@angular/router';
import type { CanLeave } from './can-leave';

/** Asks a page with unsaved work before the router leaves it (L2-079 criterion 1, ADR 0056). */
export const unsavedChangesGuard: CanDeactivateFn<CanLeave> = (page) => page.canLeave();
