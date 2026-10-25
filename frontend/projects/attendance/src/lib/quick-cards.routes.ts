import { Routes } from '@angular/router';
import { QuickCardPage } from './quick-card-page/quick-card-page';

/** The Quick Cards module's routes; the app mounts them at /quick-cards while the module is on. */
export const quickCardRoutes: Routes = [
  { path: ':childId', component: QuickCardPage, title: 'Quick Card · PromiseHub' },
];
