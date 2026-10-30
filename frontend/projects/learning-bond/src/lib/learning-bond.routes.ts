import { Routes } from '@angular/router';
import { LearningBondCoveragePage } from './coverage/learning-bond-coverage-page';

/** Staff pages under /learning-bond, loaded only while Learning Bond is on (L2-162 criterion 3). Screens arrive with prompt 85 onward. */
export const routes: Routes = [];

/**
 * Settings › Learning Bond under /settings/learning-bond, loaded only while Learning Bond is on. The agreement page is the settings
 * library's, served while the module is still off (ADR 0077).
 */
export const settingsRoutes: Routes = [
  {
    path: 'coverage',
    component: LearningBondCoveragePage,
    title: 'Coverage · Learning Bond · PromiseHub',
  },
];

/** Guardian pages under /g/learning-bond/:token, loaded only when the server answers the link (L2-162 criterion 6). Screens arrive with prompt 86 onward. */
export const guardianRoutes: Routes = [];
