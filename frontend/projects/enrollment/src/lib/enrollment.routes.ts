import { Routes } from '@angular/router';
import { ImportRosterPage } from './import-roster-page/import-roster-page';

/** Mounted by the app at /import while the Roster module is on. */
export const routes: Routes = [
  { path: '', component: ImportRosterPage, title: 'Import a roster · PromiseHub' },
];
