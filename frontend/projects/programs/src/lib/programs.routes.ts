import { Routes } from '@angular/router';
import { ProgramFormPage } from './program-form-page/program-form-page';
import { ProgramPage } from './program-page/program-page';
import { ProgramsPage } from './programs-page/programs-page';

export const routes: Routes = [
  { path: '', component: ProgramsPage, title: 'Programs · PromiseHub' },
  { path: 'new', component: ProgramFormPage, title: 'New program · PromiseHub' },
  { path: ':programId', component: ProgramPage, title: 'Program · PromiseHub' },
  { path: ':programId/edit', component: ProgramFormPage, title: 'Edit program · PromiseHub' },
];
