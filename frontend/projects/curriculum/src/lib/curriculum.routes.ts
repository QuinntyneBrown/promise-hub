import { Routes } from '@angular/router';
import { CurriculumTracksPage } from './curriculum-tracks-page/curriculum-tracks-page';
import { LessonEditorPage } from './lesson-editor-page/lesson-editor-page';
import { ModuleEditorPage } from './module-editor-page/module-editor-page';
import { QuizBuilderPage } from './quiz-builder-page/quiz-builder-page';

export const routes: Routes = [
  { path: '', component: CurriculumTracksPage, title: 'Curriculum · PromiseHub' },
  { path: 'modules/:moduleId', component: ModuleEditorPage, title: 'Module · PromiseHub' },
  { path: 'lessons/:lessonId', component: LessonEditorPage, title: 'Lesson · PromiseHub' },
  { path: 'quizzes/:quizId', component: QuizBuilderPage, title: 'Quiz · PromiseHub' },
];
