import { Routes } from '@angular/router';
import { SignOnTabletPage } from './sign-on-tablet-page/sign-on-tablet-page';
import { SlipEditorPage } from './slip-editor-page/slip-editor-page';
import { SlipsPage } from './slips-page/slips-page';

export const routes: Routes = [
  { path: '', component: SlipsPage, title: 'Permission slips · PromiseHub' },
];

/** Mounted by the app at /events/:eventId/slip, where the mocks put the editor. */
export const slipEditorRoutes: Routes = [
  { path: '', component: SlipEditorPage, title: 'Permission slip · PromiseHub' },
];

/** Mounted by the app at /check-in/:sessionId/sign-on-tablet/:householdId, from the day-of roster. */
export const signOnTabletRoutes: Routes = [
  { path: '', component: SignOnTabletPage, title: 'Sign on this tablet · PromiseHub' },
];
