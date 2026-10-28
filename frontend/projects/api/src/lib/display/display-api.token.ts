import { InjectionToken } from '@angular/core';
import type { DisplayApi } from './display-api';

export const DISPLAY_API = new InjectionToken<DisplayApi>('DISPLAY_API');
