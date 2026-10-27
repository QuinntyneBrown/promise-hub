import { InjectionToken } from '@angular/core';
import type { ReflectionDraftStore } from './reflection-draft-store';

export const REFLECTION_DRAFT_STORE = new InjectionToken<ReflectionDraftStore>(
  'REFLECTION_DRAFT_STORE',
);
