/** A guardian page, or why it can't show yet: the device must verify a code, the link is gone, or the page isn't available. */
export type GuardianPageResult<T> =
  | { status: 'loaded'; value: T }
  | {
      status: 'verify';
      language: 'en' | 'es' | 'fr';
      organization: string;
      phone: string | null;
      contacts: string[];
    }
  | { status: 'gone'; organization: string | null; phone: string | null }
  | { status: 'not-found' }
  | { status: 'error' };
