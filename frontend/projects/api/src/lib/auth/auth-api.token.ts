import { InjectionToken } from '@angular/core';
import type { AuthApi } from './auth-api';

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');
