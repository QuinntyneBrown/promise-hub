import { Routes } from '@angular/router';
import { ApplicationsPage } from './applications-page/applications-page';
import { ImportRosterPage } from './import-roster-page/import-roster-page';
import { ReviewRosterPage } from './review-roster-page/review-roster-page';

/** Mounted by the app at /import while the Roster module is on. */
export const routes: Routes = [
  { path: '', component: ImportRosterPage, title: 'Import a roster · PromiseHub' },
];

/** Mounted by the app at /programs/:programId/roster while the Roster module is on. */
export const reviewRoutes: Routes = [
  { path: '', component: ReviewRosterPage, title: 'Roster · PromiseHub' },
];

/** Mounted by the app at /applications while the Roster module is on (L2-072). */
export const applicationRoutes: Routes = [
  { path: '', component: ApplicationsPage, title: 'Applications · PromiseHub' },
];
