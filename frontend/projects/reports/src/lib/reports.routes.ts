import { Routes } from '@angular/router';
import { CohortReportPage } from './cohort-report-page/cohort-report-page';
import { ProgressBoardPage } from './progress-board-page/progress-board-page';
import { ReportsPage } from './reports-page/reports-page';
import { StaffReportPage } from './staff-report-page/staff-report-page';
import { YouthReportPage } from './youth-report-page/youth-report-page';

/** Mounted by the app at /reports while the Reports module is on. */
export const routes: Routes = [
  { path: '', component: ReportsPage, title: 'Reports · PromiseHub' },
  { path: 'cohorts/:programId', component: CohortReportPage, title: 'Cohort report · PromiseHub' },
  { path: 'youth/:childId', component: YouthReportPage, title: 'Youth report · PromiseHub' },
];

/** Mounted by the app at /reports/staff while Reports and Mentoring are on (L2-128). */
export const staffRoutes: Routes = [
  { path: '', component: StaffReportPage, title: 'Staff activity · PromiseHub' },
];

/** Mounted by the app at /reports/progress while Reports and Learning are on (L2-131). */
export const progressRoutes: Routes = [
  { path: '', component: ProgressBoardPage, title: 'Progress board · PromiseHub' },
];
