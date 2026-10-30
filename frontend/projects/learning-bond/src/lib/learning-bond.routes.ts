import { Routes } from '@angular/router';
import { LearningBondCoveragePage } from './coverage/learning-bond-coverage-page';
import { LearningBondFamiliesPage } from './families/learning-bond-families-page';
import { GuardianLearningBondPage } from './guardian/guardian-learning-bond-page';
import { LearningBondConsentPage } from './guardian/learning-bond-consent-page';
import { SettingsLearningBondPage } from './hub/settings-learning-bond-page';
import { LearningBondInvitationPage } from './invitation/learning-bond-invitation-page';
import { LearningBondLaunchPage } from './launch/learning-bond-launch-page';
import { LearningBondMissingContactsPage } from './launch/learning-bond-missing-contacts-page';

/** Staff pages under /learning-bond, loaded only while Learning Bond is on (L2-162 criterion 3). */
export const routes: Routes = [
  {
    path: 'families',
    component: LearningBondFamiliesPage,
    title: 'Households · Learning Bond · PromiseHub',
  },
];

/**
 * Settings › Learning Bond under /settings/learning-bond, loaded only while Learning Bond is on. The agreement page is the settings
 * library's, served while the module is still off (ADR 0077).
 */
export const settingsRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: SettingsLearningBondPage,
    title: 'Learning Bond · Settings · PromiseHub',
  },
  {
    path: 'coverage',
    component: LearningBondCoveragePage,
    title: 'Coverage · Learning Bond · PromiseHub',
  },
  {
    path: 'invitation',
    component: LearningBondInvitationPage,
    title: 'Invitation · Learning Bond · PromiseHub',
  },
  {
    path: 'launch',
    component: LearningBondLaunchPage,
    title: 'Launch · Learning Bond · PromiseHub',
  },
  {
    path: 'launch/missing-contacts',
    component: LearningBondMissingContactsPage,
    title: 'Households to collect from · Learning Bond · PromiseHub',
  },
];

/** Guardian pages under /g/learning-bond/:token, loaded only when the server answers the link (L2-162 criterion 6). */
export const guardianRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: GuardianLearningBondPage,
    title: 'Learning Bond · PromiseHub',
  },
  {
    path: 'consent',
    component: LearningBondConsentPage,
    title: 'Consent · Learning Bond · PromiseHub',
  },
];
