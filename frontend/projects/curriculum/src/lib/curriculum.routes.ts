import { Routes } from '@angular/router';
import { CurriculumTracksPage } from './curriculum-tracks-page/curriculum-tracks-page';
import { ModuleEditorPage } from './module-editor-page/module-editor-page';

export const routes: Routes = [
  { path: '', component: CurriculumTracksPage, title: 'Curriculum · PromiseHub' },
  { path: 'modules/:moduleId', component: ModuleEditorPage, title: 'Module · PromiseHub' },
];
