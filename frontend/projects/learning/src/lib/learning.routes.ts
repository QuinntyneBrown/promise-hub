import { Routes } from '@angular/router';
import { CodingPage } from './coding-page/coding-page';
import { LearningPage } from './learning-page/learning-page';
import { LessonPage } from './lesson-page/lesson-page';
import { ModulePage } from './module-page/module-page';
import { TrackPage } from './track-page/track-page';
import { YouthWelcomePage } from './youth-welcome/youth-welcome-page';

export const routes: Routes = [
  { path: '', component: LearningPage, title: 'Learning · PromiseHub' },
  { path: 'welcome', component: YouthWelcomePage, title: 'Welcome · PromiseHub' },
  { path: 'tracks/:id', component: TrackPage, title: 'Track · PromiseHub' },
  { path: 'modules/:id', component: ModulePage, title: 'Module · PromiseHub' },
  { path: 'lessons/:id', component: LessonPage, title: 'Lesson · PromiseHub' },
  { path: 'coding/:id', component: CodingPage, title: 'Coding lesson · PromiseHub' },
];
