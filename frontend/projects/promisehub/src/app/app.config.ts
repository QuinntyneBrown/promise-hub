// Scaffold only. Overwrite or delete as implementation requires. No product logic is implemented.
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = { providers: [provideRouter(routes)] };
