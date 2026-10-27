import { Routes } from '@angular/router';
import { AssignmentBuilderPage } from './assignment-builder-page/assignment-builder-page';
import { BadgeBuilderPage } from './badge-builder-page/badge-builder-page';
import { BadgesPage } from './badges-page/badges-page';
import { CurriculumTracksPage } from './curriculum-tracks-page/curriculum-tracks-page';
import { LessonEditorPage } from './lesson-editor-page/lesson-editor-page';
import { ModuleEditorPage } from './module-editor-page/module-editor-page';
import { ProgressionPage } from './progression-page/progression-page';
import { QuizBuilderPage } from './quiz-builder-page/quiz-builder-page';

export const routes: Routes = [
  { path: '', component: CurriculumTracksPage, title: 'Curriculum · PromiseHub' },
  { path: 'modules/:moduleId', component: ModuleEditorPage, title: 'Module · PromiseHub' },
  { path: 'lessons/:lessonId', component: LessonEditorPage, title: 'Lesson · PromiseHub' },
  { path: 'quizzes/:quizId', component: QuizBuilderPage, title: 'Quiz · PromiseHub' },
  {
    path: 'assignments/:assignmentId',
    component: AssignmentBuilderPage,
    title: 'Assignment · PromiseHub',
  },
  { path: 'badges', component: BadgesPage, title: 'Badges · PromiseHub' },
  { path: 'badges/new', component: BadgeBuilderPage, title: 'New badge · PromiseHub' },
  { path: 'badges/:badgeId', component: BadgeBuilderPage, title: 'Badge · PromiseHub' },
  { path: 'progression', component: ProgressionPage, title: 'Progression framework · PromiseHub' },
];
