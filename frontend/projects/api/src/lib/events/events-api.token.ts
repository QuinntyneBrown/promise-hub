import { InjectionToken } from '@angular/core';
import type { EventsApi } from './events-api';

export const EVENTS_API = new InjectionToken<EventsApi>('EVENTS_API');
