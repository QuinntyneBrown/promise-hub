import { Routes } from '@angular/router';
import { LearningBondAgreementPage } from './learning-bond-agreement/learning-bond-agreement-page';
import { LearningBondSignerPage } from './learning-bond-signer-page/learning-bond-signer-page';
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

/**
 * The Learning Bond data-handling agreement, mounted at /settings/learning-bond/agreement while Roster and Messages are on: it is read and
 * accepted before Learning Bond can be on, so it is served from Settings rather than the learning-bond library (ADR 0077).
 */
export const learningBondAgreementRoutes: Routes = [
  {
    path: '',
    component: LearningBondAgreementPage,
    title: 'Learning Bond agreement · Settings · PromiseHub',
  },
];

/**
 * The named signer's own page behind the emailed link, mounted anonymously at /sign/learning-bond: no session and no module guard, since it
 * is served while Learning Bond is off and the server decides from the link (ADR 0078).
 */
export const learningBondSignerRoutes: Routes = [
  {
    path: ':token',
    component: LearningBondSignerPage,
    title: 'Learning Bond agreement · PromiseHub',
  },
];
