import { provideHttpClient, withFetch } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ATTENDANCE_API } from './attendance/attendance-api.token';
import { HttpAttendanceApi } from './attendance/http-attendance-api';
import { AUTH_API } from './auth/auth-api.token';
import { HttpAuthApi } from './auth/http-auth-api';
import { EVENTS_API } from './events/events-api.token';
import { HttpEventsApi } from './events/http-events-api';
import { HOUSEHOLDS_API } from './households/households-api.token';
import { HttpProgramsApi } from './programs/http-programs-api';
import { PROGRAMS_API } from './programs/programs-api.token';
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
    { provide: PROGRAMS_API, useClass: HttpProgramsApi },
    { provide: EVENTS_API, useClass: HttpEventsApi },
    { provide: ATTENDANCE_API, useClass: HttpAttendanceApi },
  ]);
}
