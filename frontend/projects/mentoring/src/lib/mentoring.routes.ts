import { Routes } from '@angular/router';
import { MentorDashboardPage } from './mentor-dashboard-page/mentor-dashboard-page';
import { MentorYouthPage } from './mentor-youth-page/mentor-youth-page';

export const routes: Routes = [
  { path: '', component: MentorDashboardPage, title: 'Mentoring · PromiseHub' },
  { path: 'youth', component: MentorYouthPage, title: 'My youth · PromiseHub' },
];
