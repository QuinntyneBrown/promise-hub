import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideApi } from '@promisehub/api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      // The slip editor reads :eventId from the route the app mounts it on.
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideApi(),
  ],
};
