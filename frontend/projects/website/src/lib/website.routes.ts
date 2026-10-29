import { Routes } from '@angular/router';
import { SiteAboutPage } from './site-about-page/site-about-page';
import { SiteContactPage } from './site-contact-page/site-contact-page';
import { SiteGetInvolvedPage } from './site-get-involved-page/site-get-involved-page';
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
      { path: 'get-involved', component: SiteGetInvolvedPage },
      { path: 'contact', component: SiteContactPage },
      { path: 'privacy', component: SitePrivacyPage },
      { path: '**', redirectTo: '' },
    ],
  },
];
