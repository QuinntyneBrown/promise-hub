import type { Observable } from 'rxjs';

/** A page that may hold unsaved work and decides whether the router may leave it (L2-079). */
export interface CanLeave {
  canLeave(): Observable<boolean> | boolean;
}
