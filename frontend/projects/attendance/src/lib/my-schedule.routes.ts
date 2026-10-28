import { Routes } from '@angular/router';
import { MySchedulePage } from './my-schedule-page/my-schedule-page';

/** A volunteer's own schedule (L2-101), lazy-loaded at /my-schedule while Roll Call is on. */
export const myScheduleRoutes: Routes = [
  { path: '', component: MySchedulePage, title: 'Your schedule · PromiseHub' },
];
