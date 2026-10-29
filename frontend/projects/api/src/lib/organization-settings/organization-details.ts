/** The organization's profile on Settings › Organization (L2-122) and whether a logo is set (L2-123). */
export interface OrganizationDetails {
  name: string;
  city: string;
  contactEmail: string | null;
  phone: string | null;
  /** An IANA time zone, such as America/Toronto. */
  timeZone: string;
  hasLogo: boolean;
}
