import { Routes } from '@angular/router';
import { AccountDeactivatedPage } from './account-deactivated/account-deactivated-page';
import { AccountPage } from './account-page/account-page';
import { ForgotPasswordPage } from './forgot-password/forgot-password-page';
import { ResetPasswordPage } from './reset-password/reset-password-page';
import { AcceptInvitePage } from './accept-invite/accept-invite-page';
import { MfaPage } from './mfa/mfa-page';
import { NotificationPreferencesPage } from './notification-preferences/notification-preferences-page';
import { OnboardPhonePage } from './onboard-phone/onboard-phone-page';
import { OnboardReadyPage } from './onboard-ready/onboard-ready-page';
import { DisplayPage } from './display-page/display-page';
import { ProfilePage } from './profile-page/profile-page';
import { SignInPage } from './sign-in/sign-in-page';
import { SignedOutPage } from './signed-out/signed-out-page';

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

/** Your account, mounted by the app at /account inside the staff shell. */
export const accountRoutes: Routes = [
  { path: '', component: AccountPage, title: 'Your account · PromiseHub' },
  { path: 'profile', component: ProfilePage, title: 'Profile · PromiseHub' },
  { path: 'display', component: DisplayPage, title: 'Display · PromiseHub' },
  {
    path: 'notifications',
    component: NotificationPreferencesPage,
    title: 'Notification preferences · PromiseHub',
  },
];

/** Recovering access, outside the shell: mounted at /forgot-password and /reset-password. */
export const forgotRoutes: Routes = [
  { path: '', component: ForgotPasswordPage, title: 'Reset your password · PromiseHub' },
];

export const resetRoutes: Routes = [
  { path: '', component: ResetPasswordPage, title: 'Choose a new password · PromiseHub' },
];

/** After signing out, outside the shell: mounted at /signed-out (L2-048). */
export const signedOutRoutes: Routes = [
  { path: '', component: SignedOutPage, title: 'Signed out · PromiseHub' },
];

/** An account whose every membership was removed, outside the shell: mounted at /account-deactivated (L2-050). */
export const deactivatedRoutes: Routes = [
  { path: '', component: AccountDeactivatedPage, title: 'Account inactive · PromiseHub' },
];
