import { Routes } from '@angular/router';
import { AcceptInvitePage } from './accept-invite/accept-invite-page';
import { MfaPage } from './mfa/mfa-page';
import { OnboardPhonePage } from './onboard-phone/onboard-phone-page';
import { OnboardReadyPage } from './onboard-ready/onboard-ready-page';
import { SignInPage } from './sign-in/sign-in-page';

export const routes: Routes = [
  { path: '', component: SignInPage, title: 'Sign in · PromiseHub' },
  { path: 'mfa', component: MfaPage, title: 'Enter your code · PromiseHub' },
];

/** Mounted by the app at /invite: anonymous, reached from the emailed link. */
export const inviteRoutes: Routes = [
  { path: ':token', component: AcceptInvitePage, title: 'Join · PromiseHub' },
];

/** Mounted by the app at /welcome behind sign-in: the new worker's first steps. */
export const welcomeRoutes: Routes = [
  { path: 'phone', component: OnboardPhonePage, title: 'Your mobile · PromiseHub' },
  { path: 'ready', component: OnboardReadyPage, title: 'You’re ready · PromiseHub' },
];
