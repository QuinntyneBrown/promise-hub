import { Routes } from '@angular/router';
import { ForbiddenPage } from './errors/forbidden/forbidden-page';
import { MaintenancePage } from './errors/maintenance/maintenance-page';
import { NotFoundPage } from './errors/not-found/not-found-page';
import { OfflinePage } from './errors/offline/offline-page';
import { ServerErrorPage } from './errors/server-error/server-error-page';
import { authGuard } from './auth/auth.guard';
import { Shell } from './shell/shell';

export const routes: Routes = [
  { path: 'sign-in', loadChildren: () => import('@promisehub/account').then((m) => m.routes) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', loadChildren: () => import('@promisehub/today').then((m) => m.routes) },
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
