import { Routes } from '@angular/router';
import { AssignmentPage } from './assignment-page/assignment-page';
import { BadgesPage } from './badges-page/badges-page';
import { CodingPage } from './coding-page/coding-page';
import { JourneyPage } from './journey-page/journey-page';
import { LearningPage } from './learning-page/learning-page';
import { LessonPage } from './lesson-page/lesson-page';
import { ModulePage } from './module-page/module-page';
import { ProgressPage } from './progress-page/progress-page';
import { QuizIntroPage } from './quiz-intro-page/quiz-intro-page';
import { QuizPage } from './quiz-page/quiz-page';
import { QuizResultPage } from './quiz-result-page/quiz-result-page';
import { SubmissionPage } from './submission-page/submission-page';
import { SubmitPage } from './submit-page/submit-page';
import { TrackPage } from './track-page/track-page';
import { unsavedChangesGuard } from './unsaved-changes.guard';
import { YouthWelcomePage } from './youth-welcome/youth-welcome-page';

export const routes: Routes = [
  { path: '', component: LearningPage, title: 'Learning · PromiseHub' },
  { path: 'welcome', component: YouthWelcomePage, title: 'Welcome · PromiseHub' },
  { path: 'journey', component: JourneyPage, title: 'Your journey · PromiseHub' },
  { path: 'badges', component: BadgesPage, title: 'Badges · PromiseHub' },
  { path: 'progress', component: ProgressPage, title: 'Your progress · PromiseHub' },
  { path: 'tracks/:id', component: TrackPage, title: 'Track · PromiseHub' },
  { path: 'modules/:id', component: ModulePage, title: 'Module · PromiseHub' },
  { path: 'lessons/:id', component: LessonPage, title: 'Lesson · PromiseHub' },
  { path: 'coding/:id', component: CodingPage, title: 'Coding lesson · PromiseHub' },
  { path: 'quizzes/:id', component: QuizIntroPage, title: 'Quiz · PromiseHub' },
  { path: 'quizzes/:id/take', component: QuizPage, title: 'Taking a quiz · PromiseHub' },
  { path: 'attempts/:id', component: QuizResultPage, title: 'Quiz result · PromiseHub' },
  { path: 'assignments/:id', component: AssignmentPage, title: 'Assignment · PromiseHub' },
  {
    path: 'assignments/:id/submit',
    component: SubmitPage,
    canDeactivate: [unsavedChangesGuard],
    title: 'Submit an assignment · PromiseHub',
  },
  { path: 'submissions/:id', component: SubmissionPage, title: 'Your submission · PromiseHub' },
];
