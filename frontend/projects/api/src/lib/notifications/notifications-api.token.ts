import { InjectionToken } from '@angular/core';
import type { NotificationsApi } from './notifications-api';

export const NOTIFICATIONS_API = new InjectionToken<NotificationsApi>('NOTIFICATIONS_API');
