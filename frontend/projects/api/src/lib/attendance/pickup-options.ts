import type { ApprovedAdult } from './approved-adult';

/** The approved adults for sign-out, primary first, and whom to call for anyone else. */
export interface PickupOptions {
  childId: string;
  childName: string;
  primaryName: string | null;
  primaryPhone: string | null;
  approved: ApprovedAdult[];
}
