import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { ForbiddenPage } from './errors/forbidden/forbidden-page';
import { MaintenancePage } from './errors/maintenance/maintenance-page';
import { NotFoundPage } from './errors/not-found/not-found-page';
import { OfflinePage } from './errors/offline/offline-page';
import { ServerErrorPage } from './errors/server-error/server-error-page';
import { moduleRoute } from './modules/module-route';
import { websiteOn } from './modules/website.guard';
import { Shell } from './shell/shell';

export const routes: Routes = [
  { path: 'sign-in', loadChildren: () => import('@promisehub/account').then((m) => m.routes) },
  { path: 'invite', loadChildren: () => import('@promisehub/account').then((m) => m.inviteRoutes) },
  {
    path: 'forgot-password',
    loadChildren: () => import('@promisehub/account').then((m) => m.forgotRoutes),
  },
  {
    path: 'reset-password',
    loadChildren: () => import('@promisehub/account').then((m) => m.resetRoutes),
  },
  {
    path: 'account-deactivated',
    loadChildren: () => import('@promisehub/account').then((m) => m.deactivatedRoutes),
  },
  {
    path: 'signed-out',
    loadChildren: () => import('@promisehub/account').then((m) => m.signedOutRoutes),
  },
  {
    path: 'welcome',
    canActivate: [authGuard],
    loadChildren: () => import('@promisehub/account').then((m) => m.welcomeRoutes),
  },
  // Guardian pages: anonymous, reached by a link and a code; the server answers for the link's organization.
  { path: 'g', loadChildren: () => import('@promisehub/guardian').then((m) => m.routes) },
  // The public website: anonymous; the library loads only when the server says the slug's site is published (ADR 0043).
  {
    path: 'site/:slug',
    canMatch: [websiteOn],
    loadChildren: () => import('@promisehub/website').then((m) => m.routes),
  },
  {
    path: 'site/:slug',
    loadComponent: () =>
      import('./errors/site-not-found/site-not-found-page').then((m) => m.SiteNotFoundPage),
    title: 'Page not found',
  },
  {
    path: 'site/:slug/**',
    loadComponent: () =>
      import('./errors/site-not-found/site-not-found-page').then((m) => m.SiteNotFoundPage),
    title: 'Page not found',
  },
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
        path: 'account',
        loadChildren: () => import('@promisehub/account').then((m) => m.accountRoutes),
      },
      {
        path: 'setup',
        loadChildren: () => import('@promisehub/settings').then((m) => m.setupRoutes),
      },
      {
        path: 'notifications',
        loadChildren: () => import('@promisehub/today').then((m) => m.notificationRoutes),
      },
      {
        path: 'admin/organizations',
        loadChildren: () => import('@promisehub/administration').then((m) => m.organizationsRoutes),
      },
      {
        path: 'settings/audit',
        loadChildren: () => import('@promisehub/administration').then((m) => m.auditRoutes),
      },
      {
        path: 'settings/billing',
        loadChildren: () => import('@promisehub/administration').then((m) => m.billingRoutes),
      },
      {
        path: 'settings/coverage',
        loadChildren: () => import('@promisehub/administration').then((m) => m.coverageRoutes),
      },
      {
        path: 'people',
        loadChildren: () => import('@promisehub/administration').then((m) => m.peopleRoutes),
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
      ...moduleRoute('applications', 'Roster', () =>
        import('@promisehub/enrollment').then((m) => m.applicationRoutes),
      ),
      ...moduleRoute('families', 'Roster', () =>
        import('@promisehub/households').then((m) => m.routes),
      ),
      ...moduleRoute('search', 'Roster', () =>
        import('@promisehub/households').then((m) => m.searchRoutes),
      ),
      ...moduleRoute('check-in/:sessionId/sign-on-tablet/:householdId', 'Slips', () =>
        import('@promisehub/slips').then((m) => m.signOnTabletRoutes),
      ),
      ...moduleRoute('check-in', 'RollCall', () =>
        import('@promisehub/attendance').then((m) => m.routes),
      ),
      ...moduleRoute('my-schedule', 'RollCall', () =>
        import('@promisehub/attendance').then((m) => m.myScheduleRoutes),
      ),
      ...moduleRoute('quick-cards', 'QuickCards', () =>
        import('@promisehub/attendance').then((m) => m.quickCardRoutes),
      ),
      ...moduleRoute('events/:eventId/slip', 'Slips', () =>
        import('@promisehub/slips').then((m) => m.slipEditorRoutes),
      ),
      ...moduleRoute('events', 'Slips', () => import('@promisehub/events').then((m) => m.routes)),
      ...moduleRoute('schedule', 'Roster', () =>
        import('@promisehub/events').then((m) => m.scheduleRoutes),
      ),
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
      ...moduleRoute('announcements', 'Messages', () =>
        import('@promisehub/messaging').then((m) => m.announcementRoutes),
      ),
      ...moduleRoute('conversations', ['Messages', 'Mentoring'], () =>
        import('@promisehub/messaging').then((m) => m.conversationRoutes),
      ),
      ...moduleRoute('incidents', 'Incidents', () =>
        import('@promisehub/incidents').then((m) => m.routes),
      ),
      // Staff activity needs Mentoring and the progress board Learning as well as Reports (L2-128, L2-131, ADR 0074).
      ...moduleRoute('reports/staff', ['Reports', 'Mentoring'], () =>
        import('@promisehub/reports').then((m) => m.staffRoutes),
      ),
      ...moduleRoute('reports/progress', ['Reports', 'Learning'], () =>
        import('@promisehub/reports').then((m) => m.progressRoutes),
      ),
      ...moduleRoute('reports', 'Reports', () =>
        import('@promisehub/reports').then((m) => m.routes),
      ),
      ...moduleRoute('learning', 'Learning', () =>
        import('@promisehub/learning').then((m) => m.routes),
      ),
      ...moduleRoute('curriculum', 'Learning', () =>
        import('@promisehub/curriculum').then((m) => m.routes),
      ),
      ...moduleRoute('mentoring/reviews', ['Mentoring', 'Learning'], () =>
        import('@promisehub/mentoring').then((m) => m.reviewRoutes),
      ),
      ...moduleRoute('mentoring', 'Mentoring', () =>
        import('@promisehub/mentoring').then((m) => m.routes),
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
