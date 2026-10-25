import { Routes } from '@angular/router';
import { SettingsModulesPage } from './modules/settings-modules-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'modules' },
  { path: 'modules', component: SettingsModulesPage, title: 'Modules · Settings · PromiseHub' },
];
