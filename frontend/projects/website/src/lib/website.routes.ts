import { Routes } from '@angular/router';
import { SiteAboutPage } from './site-about-page/site-about-page';
import { SiteLandingPage } from './site-landing-page/site-landing-page';
import { SiteLayout } from './site-layout/site-layout';
import { SitePrivacyPage } from './site-privacy-page/site-privacy-page';
import { SiteProgramsPage } from './site-programs-page/site-programs-page';

/** The public website under /site/:slug (L2-132): every page inside the site frame; any other path goes home. */
export const routes: Routes = [
  {
    path: '',
    component: SiteLayout,
    children: [
      { path: '', component: SiteLandingPage },
      { path: 'programs', component: SiteProgramsPage },
      { path: 'about', component: SiteAboutPage },
      { path: 'privacy', component: SitePrivacyPage },
      { path: '**', redirectTo: '' },
    ],
  },
];
