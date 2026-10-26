import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { ForbiddenPage } from './errors/forbidden/forbidden-page';
import { MaintenancePage } from './errors/maintenance/maintenance-page';
import { NotFoundPage } from './errors/not-found/not-found-page';
import { OfflinePage } from './errors/offline/offline-page';
import { ServerErrorPage } from './errors/server-error/server-error-page';
import { moduleRoute } from './modules/module-route';
import { Shell } from './shell/shell';

export const routes: Routes = [
  { path: 'sign-in', loadChildren: () => import('@promisehub/account').then((m) => m.routes) },
  { path: 'invite', loadChildren: () => import('@promisehub/account').then((m) => m.inviteRoutes) },
  {
    path: 'welcome',
    canActivate: [authGuard],
    loadChildren: () => import('@promisehub/account').then((m) => m.welcomeRoutes),
  },
  // Guardian pages: anonymous, reached by a link and a code; the server answers for the link's organization.
  { path: 'g', loadChildren: () => import('@promisehub/guardian').then((m) => m.routes) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadChildren: () => import('@promisehub/today').then((m) => m.routes),
      },
      {
        path: 'settings/staff',
        loadChildren: () => import('@promisehub/administration').then((m) => m.routes),
      },
      {
        path: 'settings',
        loadChildren: () => import('@promisehub/settings').then((m) => m.routes),
      },
      ...moduleRoute('import', 'Roster', () =>
        import('@promisehub/enrollment').then((m) => m.routes),
      ),
      ...moduleRoute('families', 'Roster', () =>
        import('@promisehub/households').then((m) => m.routes),
      ),
      ...moduleRoute('check-in/:sessionId/sign-on-tablet/:householdId', 'Slips', () =>
        import('@promisehub/slips').then((m) => m.signOnTabletRoutes),
      ),
      ...moduleRoute('check-in', 'RollCall', () =>
        import('@promisehub/attendance').then((m) => m.routes),
      ),
      ...moduleRoute('quick-cards', 'QuickCards', () =>
        import('@promisehub/attendance').then((m) => m.quickCardRoutes),
      ),
      ...moduleRoute('events/:eventId/slip', 'Slips', () =>
        import('@promisehub/slips').then((m) => m.slipEditorRoutes),
      ),
      ...moduleRoute('events', 'Slips', () => import('@promisehub/events').then((m) => m.routes)),
      ...moduleRoute('programs/:programId/roster', 'Roster', () =>
        import('@promisehub/enrollment').then((m) => m.reviewRoutes),
      ),
      ...moduleRoute('programs', 'Slips', () =>
        import('@promisehub/programs').then((m) => m.routes),
      ),
      ...moduleRoute('slips', 'Slips', () => import('@promisehub/slips').then((m) => m.routes)),
      ...moduleRoute('messages', 'Messages', () =>
        import('@promisehub/messaging').then((m) => m.routes),
      ),
      ...moduleRoute('incidents', 'Incidents', () =>
        import('@promisehub/incidents').then((m) => m.routes),
      ),
      ...moduleRoute('reports', 'Reports', () =>
        import('@promisehub/reports').then((m) => m.routes),
      ),
      { path: 'forbidden', component: ForbiddenPage, title: 'No access · PromiseHub' },
      {
        path: 'server-error',
        component: ServerErrorPage,
        title: 'Something went wrong · PromiseHub',
      },
      { path: 'offline', component: OfflinePage, title: 'Offline · PromiseHub' },
      { path: 'maintenance', component: MaintenancePage, title: 'Maintenance · PromiseHub' },
      { path: '**', component: NotFoundPage, title: 'Page not found · PromiseHub' },
    ],
  },
];
