import { Routes } from '@angular/router';
import { SettingsModulesPage } from './modules/settings-modules-page';
import { SettingsNotificationsPage } from './notifications/settings-notifications-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'modules' },
  { path: 'modules', component: SettingsModulesPage, title: 'Modules · Settings · PromiseHub' },
  {
    path: 'notifications',
    component: SettingsNotificationsPage,
    title: 'Notifications · Settings · PromiseHub',
  },
];
