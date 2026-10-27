import { Routes } from '@angular/router';
import { LearningPage } from './learning-page/learning-page';
import { YouthWelcomePage } from './youth-welcome/youth-welcome-page';

export const routes: Routes = [
  { path: '', component: LearningPage, title: 'Learning · PromiseHub' },
  { path: 'welcome', component: YouthWelcomePage, title: 'Welcome · PromiseHub' },
];
