import { InjectionToken } from '@angular/core';
import type { DraftStore } from './draft-store';

export const DRAFT_STORE = new InjectionToken<DraftStore>('DRAFT_STORE');
