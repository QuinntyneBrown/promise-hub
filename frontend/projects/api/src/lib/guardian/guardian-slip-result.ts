import type { GuardianSlip } from './guardian-slip';

/** The slip, or why it can't show yet: the device must verify a code, the link is gone, or the page isn't available. */
export type GuardianSlipResult =
  | { status: 'loaded'; value: GuardianSlip }
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
