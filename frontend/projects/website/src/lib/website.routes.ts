import { Routes } from '@angular/router';
import { SiteLandingPage } from './site-landing-page/site-landing-page';
import { SiteLayout } from './site-layout/site-layout';

/** The public website under /site/:slug (L2-132): every page inside the site frame; any other path goes home. */
export const routes: Routes = [
  {
    path: '',
    component: SiteLayout,
    children: [
      { path: '', component: SiteLandingPage },
      { path: '**', redirectTo: '' },
    ],
  },
];
