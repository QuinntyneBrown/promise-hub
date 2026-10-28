import { InjectionToken } from '@angular/core';
import type { NotificationPreferencesApi } from './notification-preferences-api';

export const NOTIFICATION_PREFERENCES_API = new InjectionToken<NotificationPreferencesApi>(
  'NOTIFICATION_PREFERENCES_API',
);
