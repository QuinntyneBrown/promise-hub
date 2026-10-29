import { Routes } from '@angular/router';
import { SettingsModulesPage } from './modules/settings-modules-page';
import { SettingsOrganizationPage } from './organization/settings-organization-page';
import { SettingsNotificationsPage } from './notifications/settings-notifications-page';
import { SettingsPrivacyPage } from './privacy/settings-privacy-page';
import { SetupOrganizationPage } from './setup/setup-organization-page';
import { SetupPage } from './setup/setup-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'organization' },
  {
    path: 'organization',
    component: SettingsOrganizationPage,
    title: 'Organization · Settings · PromiseHub',
  },
  { path: 'modules', component: SettingsModulesPage, title: 'Modules · Settings · PromiseHub' },
  {
    path: 'privacy',
    component: SettingsPrivacyPage,
    title: 'Privacy and data · Settings · PromiseHub',
  },
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
