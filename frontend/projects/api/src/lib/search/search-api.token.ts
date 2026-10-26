import { InjectionToken } from '@angular/core';
import type { SearchApi } from './search-api';

export const SEARCH_API = new InjectionToken<SearchApi>('SEARCH_API');
