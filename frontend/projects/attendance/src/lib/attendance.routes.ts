import { Routes } from '@angular/router';
import { AttendanceHistoryPage } from './attendance-history-page/attendance-history-page';
import { CheckInPage } from './check-in-page/check-in-page';

export const routes: Routes = [
  { path: '', component: CheckInPage, title: 'Check-in · PromiseHub' },
  { path: 'history', component: AttendanceHistoryPage, title: 'Attendance history · PromiseHub' },
  { path: ':sessionId', component: CheckInPage, title: 'Check-in · PromiseHub' },
];
