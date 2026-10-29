import type { ModuleCompletion } from './module-completion';

/** Learning in a cohort: the average completion of active youth with an account, and each published module of its track. */
export interface CohortLearning {
  averageCompletion: number | null;
  modules: ModuleCompletion[];
}
