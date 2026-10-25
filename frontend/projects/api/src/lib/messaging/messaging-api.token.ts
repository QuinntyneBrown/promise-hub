import { InjectionToken } from '@angular/core';
import type { MessagingApi } from './messaging-api';

export const MESSAGING_API = new InjectionToken<MessagingApi>('MESSAGING_API');
