import { Routes } from '@angular/router';
import { SlipEditorPage } from './slip-editor-page/slip-editor-page';
import { SlipsPage } from './slips-page/slips-page';

export const routes: Routes = [
  { path: '', component: SlipsPage, title: 'Permission slips · PromiseHub' },
];

/** Mounted by the app at /events/:eventId/slip, where the mocks put the editor. */
export const slipEditorRoutes: Routes = [
  { path: '', component: SlipEditorPage, title: 'Permission slip · PromiseHub' },
];
