/** Who referred the young person, and the contact they verified. */
export interface ApplicationReferrer {
  name: string;
  role: string | null;
  organization: string | null;
  contact: string | null;
}
