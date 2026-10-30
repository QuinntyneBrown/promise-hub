import { Routes } from '@angular/router';

/** Staff pages under /learning-bond, loaded only while Learning Bond is on (L2-162 criterion 3). Screens arrive with prompt 83 onward. */
export const routes: Routes = [];

/** Guardian pages under /g/learning-bond/:token, loaded only when the server answers the link (L2-162 criterion 6). Screens arrive with prompt 86 onward. */
export const guardianRoutes: Routes = [];
