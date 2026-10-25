import { provideHttpClient, withFetch } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AUTH_API } from './auth/auth-api.token';
import { HttpAuthApi } from './auth/http-auth-api';
import { HttpSessionApi } from './session/http-session-api';
import { SESSION_API } from './session/session-api.token';

/** Registers the HTTP implementations behind every API token. */
export function provideApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    { provide: SESSION_API, useClass: HttpSessionApi },
    { provide: AUTH_API, useClass: HttpAuthApi },
  ]);
}
