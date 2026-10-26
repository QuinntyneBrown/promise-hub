import { InjectionToken } from '@angular/core';
import type { NotificationSettingsApi } from './notification-settings-api';

export const NOTIFICATION_SETTINGS_API = new InjectionToken<NotificationSettingsApi>(
  'NOTIFICATION_SETTINGS_API',
);
