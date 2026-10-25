import { Routes } from '@angular/router';
import { CheckInPage } from './check-in-page/check-in-page';

export const routes: Routes = [
  { path: '', component: CheckInPage, title: 'Check-in · PromiseHub' },
  { path: ':sessionId', component: CheckInPage, title: 'Check-in · PromiseHub' },
];
