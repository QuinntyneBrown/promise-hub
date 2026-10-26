import { InjectionToken } from '@angular/core';
import type { WebsiteApi } from './website-api';

export const WEBSITE_API = new InjectionToken<WebsiteApi>('WEBSITE_API');
