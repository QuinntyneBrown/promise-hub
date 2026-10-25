/** A read: the value, or why there is none. Pages render each status; they never read HTTP errors. */
export type LoadResult<T> =
  | { status: 'loaded'; value: T }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error' };
