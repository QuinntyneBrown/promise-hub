import { Routes } from '@angular/router';
import { GuardianSlipPage } from './guardian-slip-page/guardian-slip-page';

/** Guardian pages: anonymous, outside the staff shell. */
export const routes: Routes = [
  { path: 'slip/:token', component: GuardianSlipPage, title: 'Permission slip' },
];
