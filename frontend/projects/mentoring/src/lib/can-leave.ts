import type { Observable } from 'rxjs';

/** A page that may hold an unsaved grade and decides whether the router may leave it (L2-080 criterion 8). */
export interface CanLeave {
  canLeave(): Observable<boolean> | boolean;
}
