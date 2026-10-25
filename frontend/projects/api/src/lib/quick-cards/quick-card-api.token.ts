import { InjectionToken } from '@angular/core';
import type { QuickCardApi } from './quick-card-api';

export const QUICK_CARD_API = new InjectionToken<QuickCardApi>('QUICK_CARD_API');
