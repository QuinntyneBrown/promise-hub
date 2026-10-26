import { InjectionToken } from '@angular/core';
import type { LearningApi } from './learning-api';

export const LEARNING_API = new InjectionToken<LearningApi>('LEARNING_API');
