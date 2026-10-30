import { InjectionToken } from '@angular/core';
import type { LearningBondApi } from './learning-bond-api';

export const LEARNING_BOND_API = new InjectionToken<LearningBondApi>('LEARNING_BOND_API');
