import { Routes } from '@angular/router';
import { CohortReportPage } from './cohort-report-page/cohort-report-page';
import { ReportsPage } from './reports-page/reports-page';
import { YouthReportPage } from './youth-report-page/youth-report-page';

/** Mounted by the app at /reports while the Reports module is on. */
export const routes: Routes = [
  { path: '', component: ReportsPage, title: 'Reports · PromiseHub' },
  { path: 'cohorts/:programId', component: CohortReportPage, title: 'Cohort report · PromiseHub' },
  { path: 'youth/:childId', component: YouthReportPage, title: 'Youth report · PromiseHub' },
];
