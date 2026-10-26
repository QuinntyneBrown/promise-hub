import { InjectionToken } from '@angular/core';
import type { PlatformApi } from './platform-api';

export const PLATFORM_API = new InjectionToken<PlatformApi>('PLATFORM_API');
