import type { RubricCriterion } from '@promisehub/api';

/** The criterion to edit with its number, or nothing to add one. */
export interface RubricCriterionDialogData {
  criterion?: RubricCriterion;
  number?: number;
}
