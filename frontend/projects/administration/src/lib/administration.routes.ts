import { Routes } from '@angular/router';
import { CoveragePage } from './coverage-page/coverage-page';
import { StaffPage } from './staff-page/staff-page';

/** Mounted by the app at /settings/staff; staff access is always part of the product. */
export const routes: Routes = [
  { path: '', component: StaffPage, title: 'Staff and roles · PromiseHub' },
];

/** Mounted by the app at /settings/coverage. */
export const coverageRoutes: Routes = [
  { path: '', component: CoveragePage, title: 'Staff coverage · PromiseHub' },
];
