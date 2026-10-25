import { provideHttpClient, withFetch } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AUTH_API } from './auth/auth-api.token';
import { HttpAuthApi } from './auth/http-auth-api';
import { HOUSEHOLDS_API } from './households/households-api.token';
import { HttpHouseholdsApi } from './households/http-households-api';
import { HttpModulesApi } from './modules/http-modules-api';
import { MODULES_API } from './modules/modules-api.token';
import { HttpSessionApi } from './session/http-session-api';
import { SESSION_API } from './session/session-api.token';

/** Registers the HTTP implementations behind every API token. */
export function provideApi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    { provide: SESSION_API, useClass: HttpSessionApi },
    { provide: AUTH_API, useClass: HttpAuthApi },
    { provide: MODULES_API, useClass: HttpModulesApi },
    { provide: HOUSEHOLDS_API, useClass: HttpHouseholdsApi },
  ]);
}
