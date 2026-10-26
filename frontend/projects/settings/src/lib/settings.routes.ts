import { Routes } from '@angular/router';
import { SettingsModulesPage } from './modules/settings-modules-page';
import { SettingsNotificationsPage } from './notifications/settings-notifications-page';
import { SetupOrganizationPage } from './setup/setup-organization-page';
import { SetupPage } from './setup/setup-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'modules' },
  { path: 'modules', component: SettingsModulesPage, title: 'Modules · Settings · PromiseHub' },
  {
    path: 'notifications',
    component: SettingsNotificationsPage,
    title: 'Notifications · Settings · PromiseHub',
  },
];

/** The setup wizard's checklist and organization step, mounted at /setup (ADR 0033). */
export const setupRoutes: Routes = [
  { path: '', component: SetupPage, title: 'Set up · PromiseHub' },
  {
    path: 'organization',
    component: SetupOrganizationPage,
    title: 'Your organization · Set up · PromiseHub',
  },
];
