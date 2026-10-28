import { InjectionToken } from '@angular/core';
import type { AnnouncementsApi } from './announcements-api';

export const ANNOUNCEMENTS_API = new InjectionToken<AnnouncementsApi>('ANNOUNCEMENTS_API');
