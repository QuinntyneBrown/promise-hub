import { InjectionToken } from '@angular/core';
import type { RealtimeEvents } from './realtime-events';

export const REALTIME_EVENTS = new InjectionToken<RealtimeEvents>('REALTIME_EVENTS');
