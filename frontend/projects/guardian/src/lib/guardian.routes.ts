import { Routes } from '@angular/router';
import { GuardianConsentPage } from './guardian-consent-page/guardian-consent-page';
import { GuardianEnrollPage } from './guardian-enroll-page/guardian-enroll-page';
import { GuardianHomePage } from './guardian-home-page/guardian-home-page';
import { GuardianSlipPage } from './guardian-slip-page/guardian-slip-page';
import { GuardianSurveyPage } from './guardian-survey-page/guardian-survey-page';

/** Guardian pages: anonymous, outside the staff shell. */
export const routes: Routes = [
  { path: 'slip/:token', component: GuardianSlipPage, title: 'Permission slip' },
  { path: 'enroll/:slug', component: GuardianEnrollPage, title: 'Enrollment' },
  { path: 'home/:token', component: GuardianHomePage, title: 'Your family' },
  { path: 'survey/:token', component: GuardianSurveyPage, title: 'Survey' },
  { path: 'consent/:token', component: GuardianConsentPage, title: 'Guardian consent' },
];
