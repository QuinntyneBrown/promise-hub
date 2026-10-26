import type { SetupStepKey } from './setup-step-key';

/** The setup checklist: each step, the next one and whether all are done. */
export interface Setup {
  steps: { key: SetupStepKey; done: boolean }[];
  next: SetupStepKey | null;
  complete: boolean;
}
