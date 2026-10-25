/** The result of saving modules; failures are outcomes so pages never read HTTP errors. */
export type SaveModulesOutcome =
  | { status: 'saved'; on: number }
  | { status: 'invalid'; errors: { module: string; message: string }[] }
  | { status: 'forbidden' }
  | { status: 'error' };
