import type { CanDeactivateFn } from '@angular/router';
import type { CanLeave } from './can-leave';

/** Asks the grade page before the router leaves unsaved scores or a comment (L2-080 criterion 8). */
export const unsavedGradeGuard: CanDeactivateFn<CanLeave> = (page) => page.canLeave();
