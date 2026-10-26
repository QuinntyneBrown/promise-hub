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
import { HttpQuickCardApi } from './quick-cards/http-quick-card-api';
import { QUICK_CARD_API } from './quick-cards/quick-card-api.token';
import { PROGRAMS_API } from './programs/programs-api.token';
import { HttpHouseholdsApi } from './households/http-households-api';
import { HttpMessagingApi } from './messaging/http-messaging-api';
import { MESSAGING_API } from './messaging/messaging-api.token';
import { GUARDIAN_API } from './guardian/guardian-api.token';
import { GUARDIAN_ENROLLMENT_API } from './guardian/guardian-enrollment-api.token';
import { HttpGuardianEnrollmentApi } from './guardian/http-guardian-enrollment-api';
import { HttpGuardianApi } from './guardian/http-guardian-api';
import { HttpImportsApi } from './imports/http-imports-api';
import { IMPORTS_API } from './imports/imports-api.token';
import { ENROLLMENT_API } from './enrollment/enrollment-api.token';
import { HttpEnrollmentApi } from './enrollment/http-enrollment-api';
import { HttpIncidentsApi } from './incidents/http-incidents-api';
import { INCIDENTS_API } from './incidents/incidents-api.token';
import { HttpInvitationApi } from './invitations/http-invitation-api';
import { INVITATION_API } from './invitations/invitation-api.token';
import { HttpModulesApi } from './modules/http-modules-api';
import { HttpStaffApi } from './staff/http-staff-api';
import { STAFF_API } from './staff/staff-api.token';
import { HttpNotificationSettingsApi } from './notifications/http-notification-settings-api';
import { HttpNotificationsApi } from './notifications/http-notifications-api';
import { NOTIFICATION_SETTINGS_API } from './notifications/notification-settings-api.token';
import { NOTIFICATIONS_API } from './notifications/notifications-api.token';
import { HttpReportsApi } from './reports/http-reports-api';
import { REPORTS_API } from './reports/reports-api.token';
import { HttpSearchApi } from './search/http-search-api';
import { HttpSetupApi } from './setup/http-setup-api';
import { SETUP_API } from './setup/setup-api.token';
import { SEARCH_API } from './search/search-api.token';
import { HttpTodayApi } from './today/http-today-api';
import { TODAY_API } from './today/today-api.token';
import { HttpPickupApi } from './pickups/http-pickup-api';
import { PICKUP_API } from './pickups/pickup-api.token';
import { HttpSlipsApi } from './slips/http-slips-api';
import { SLIPS_API } from './slips/slips-api.token';
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
    { provide: QUICK_CARD_API, useClass: HttpQuickCardApi },
    { provide: MESSAGING_API, useClass: HttpMessagingApi },
    { provide: SLIPS_API, useClass: HttpSlipsApi },
    { provide: GUARDIAN_API, useClass: HttpGuardianApi },
    { provide: GUARDIAN_ENROLLMENT_API, useClass: HttpGuardianEnrollmentApi },
    { provide: IMPORTS_API, useClass: HttpImportsApi },
    { provide: ENROLLMENT_API, useClass: HttpEnrollmentApi },
    { provide: INCIDENTS_API, useClass: HttpIncidentsApi },
    { provide: PICKUP_API, useClass: HttpPickupApi },
    { provide: STAFF_API, useClass: HttpStaffApi },
    { provide: TODAY_API, useClass: HttpTodayApi },
    { provide: SEARCH_API, useClass: HttpSearchApi },
    { provide: SETUP_API, useClass: HttpSetupApi },
    { provide: REPORTS_API, useClass: HttpReportsApi },
    { provide: NOTIFICATIONS_API, useClass: HttpNotificationsApi },
    { provide: NOTIFICATION_SETTINGS_API, useClass: HttpNotificationSettingsApi },
    { provide: INVITATION_API, useClass: HttpInvitationApi },
  ]);
}
