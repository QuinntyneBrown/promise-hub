import { Routes } from '@angular/router';
import { StaffPage } from './staff-page/staff-page';

/** Mounted by the app at /settings/staff; staff access is always part of the product. */
export const routes: Routes = [
  { path: '', component: StaffPage, title: 'Staff and roles · PromiseHub' },
];
