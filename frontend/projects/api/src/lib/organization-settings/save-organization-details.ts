/** What the organization-profile dialog saves; an empty contact email or phone clears it. */
export interface SaveOrganizationDetails {
  name: string;
  city: string;
  contactEmail: string | null;
  phone: string | null;
  timeZone: string;
}
