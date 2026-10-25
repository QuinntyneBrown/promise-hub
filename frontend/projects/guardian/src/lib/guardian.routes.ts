import { Routes } from '@angular/router';
import { GuardianEnrollPage } from './guardian-enroll-page/guardian-enroll-page';
import { GuardianHomePage } from './guardian-home-page/guardian-home-page';
import { GuardianSlipPage } from './guardian-slip-page/guardian-slip-page';

/** Guardian pages: anonymous, outside the staff shell. */
export const routes: Routes = [
  { path: 'slip/:token', component: GuardianSlipPage, title: 'Permission slip' },
  { path: 'enroll/:slug', component: GuardianEnrollPage, title: 'Enrollment' },
  { path: 'home/:token', component: GuardianHomePage, title: 'Your family' },
];
