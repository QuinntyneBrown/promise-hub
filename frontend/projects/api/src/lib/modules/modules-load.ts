import type { ModuleId } from './module-id';

export type ModulesLoad =
  { status: 'loaded'; on: ModuleId[] } | { status: 'forbidden' } | { status: 'error' };
