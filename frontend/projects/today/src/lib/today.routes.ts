import { Routes } from '@angular/router';
import { NotificationsPage } from './notifications/notifications-page';
import { TodayPage } from './today-page';

export const routes: Routes = [{ path: '', component: TodayPage, title: 'Today · PromiseHub' }];

/** The notification center at /notifications; each notice follows its own module (ADR 0029). */
export const notificationRoutes: Routes = [
  { path: '', component: NotificationsPage, title: 'Notifications · PromiseHub' },
];
