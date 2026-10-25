// Scaffold only. Overwrite or delete as implementation requires. No product logic is implemented.
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((error: unknown) => console.error(error));
