import { InjectionToken } from '@angular/core';

/** Where the API is served from. The dev server and the deployment proxy `/api` to the backend. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => '/api' });
