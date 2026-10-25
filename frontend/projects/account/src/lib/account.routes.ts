import { Routes } from '@angular/router';
import { MfaPage } from './mfa/mfa-page';
import { SignInPage } from './sign-in/sign-in-page';

export const routes: Routes = [
  { path: '', component: SignInPage, title: 'Sign in · PromiseHub' },
  { path: 'mfa', component: MfaPage, title: 'Enter your code · PromiseHub' },
];
